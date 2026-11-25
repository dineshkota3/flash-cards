// PBKDF2-SHA256 password hashing via WebCrypto (native in workerd/Node).
// 20k iterations: workerd hard-caps PBKDF2 at 100k and the free plan budgets
// 10 ms CPU per request. A PEPPER secret is prepended to the password so a
// stolen D1 dump alone cannot be brute-forced. Iterations live in the stored
// string so future policy changes are data migrations, not code breaks.
// Format: pbkdf2_sha256$<iters>$<salt_b64url>$<hash_b64url>

const ITERATIONS = 20000
const KEY_LENGTH = 32
const enc = new TextEncoder()

export function hashPassword(password: string, pepper: string, saltB64?: string): Promise<string> {
  return (async () => {
    const salt = saltB64
      ? base64UrlDecode(saltB64)
      : crypto.getRandomValues(new Uint8Array(16))
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pepper + password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      KEY_LENGTH * 8,
    )
    const saltB64Out = saltB64 ?? toBase64Url(salt)
    return `pbkdf2_sha256$${ITERATIONS}$${saltB64Out}$${toBase64Url(new Uint8Array(bits))}`
  })()
}

export async function verifyPassword(password: string, pepper: string, stored: string): Promise<boolean> {
  const [scheme, itersStr, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'pbkdf2_sha256' || !itersStr || !saltB64 || !hashB64) return false
  const iterations = Number(itersStr)
  if (!Number.isInteger(iterations) || iterations <= 0 || iterations > 100_000) return false
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pepper + password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64UrlDecode(saltB64) as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  return timingSafeEq(new Uint8Array(bits), base64UrlDecode(hashB64))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

function timingSafeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}
