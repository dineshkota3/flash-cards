import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, StatRow } from '../lib/http'
import { apiError, getCookie, json, rowToStat } from '../lib/http'
import { clearSessionCookie, sessionCookie, SESSION_COOKIE, signSession, verifySession } from '../lib/session'
import { hashPassword, verifyPassword } from '../lib/password'
import { computeAttemptUpdate, isDirection, type AttemptInput } from '../lib/attempt'

interface UserRow {
  id: string
  email: string
  password_hash: string | null
}

/** Reject unknown directions at runtime (offline queue stores plain strings). */
function readAttemptInput(body: unknown): AttemptInput | null {
  const b = body as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  if (!isDirection(b.direction)) return null
  if (typeof b.word_id !== 'number' || !Number.isInteger(b.word_id)) return null
  if (typeof b.is_correct !== 'boolean') return null
  if (b.typed_answer !== null && typeof b.typed_answer !== 'string') return null
  return {
    word_id: b.word_id,
    direction: b.direction,
    is_correct: b.is_correct,
    // NULLIF(btrim(typed), '') replica
    typed_answer: typeof b.typed_answer === 'string' && b.typed_answer.trim() !== '' ? b.typed_answer.trim() : null,
  }
}

async function sessionUser(request: Request, env: Env): Promise<{ id: string; email: string } | null> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const payload = await verifySession(token, env.SESSION_SECRET)
  if (!payload) return null
  return { id: payload.sub, email: payload.email }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context
  const segments = (params['route'] as string[] | undefined) ?? []
  try {
    return await route(request, env, segments)
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Server error', 500)
  }
}

async function route(request: Request, env: Env, segments: string[]): Promise<Response> {
  const [a, b] = segments
  const method = request.method

  // ---- auth ----
  if (a === 'auth') {
    if (b === 'me' && method === 'GET') {
      const user = await sessionUser(request, env)
      return json({ data: user ? { user } : null })
    }
    if (b === 'logout' && method === 'POST') {
      return new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
      })
    }
    if (b === 'login' && method === 'POST') {
      const body = (await request.json()) as { email?: string; password?: string }
      if (!body.email || !body.password) return apiError('Email and password are required.', 400)
      const row = await env.DB.prepare('SELECT id, email, password_hash FROM users WHERE lower(email) = ?')
        .bind(body.email.toLowerCase())
        .first<UserRow>()
      if (!row || !row.password_hash || !(await verifyPassword(body.password, env.PEPPER, row.password_hash))) {
        return apiError('Invalid email or password.', 401)
      }
      const token = await signSession({ sub: row.id, email: row.email, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }, env.SESSION_SECRET)
      return json({ data: { user: { id: row.id, email: row.email } } }, 200, { 'Set-Cookie': sessionCookie(token) })
    }
    if (b === 'signup' && method === 'POST') {
      const body = (await request.json()) as { email?: string; password?: string }
      if (!body.email || !body.password) return apiError('Email and password are required.', 400)
      if (body.password.length < 8) return apiError('Password must be at least 8 characters.', 400)
      const email = body.email.toLowerCase()
      const member = await env.DB.prepare('SELECT email FROM app_members WHERE lower(email) = ?').bind(email).first()
      if (!member) return apiError('This email is not on the allowlist.', 403)
      const config = await env.DB.prepare("SELECT value FROM app_config WHERE key = 'signup_enabled'").first<{ value: string }>()
      if (config?.value !== 'true') return apiError('Signup is disabled.', 403)
      const existing = await env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?').bind(email).first()
      if (existing) return apiError('An account with this email already exists.', 409)
      const id = crypto.randomUUID()
      const hash = await hashPassword(body.password, env.PEPPER)
      await env.DB.batch([
        env.DB.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').bind(id, email, hash, new Date().toISOString()),
        env.DB.prepare('DELETE FROM app_members WHERE lower(email) = ?').bind(email),
      ])
      const token = await signSession({ sub: id, email, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 }, env.SESSION_SECRET)
      return json({ data: { user: { id, email } } }, 200, { 'Set-Cookie': sessionCookie(token) })
    }
  }

  // ---- everything below requires a session ----
  const user = await sessionUser(request, env)
  if (!user) return apiError('Authentication required.', 401)

  if (a === 'words' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT id, english, dutch, category, english_alts, dutch_alts, dutch_past_forms, dutch_participle_forms FROM words ORDER BY id',
    ).all<{
      id: number; english: string; dutch: string; category: string;
      english_alts: string; dutch_alts: string; dutch_past_forms: string; dutch_participle_forms: string;
    }>()
    const words = (results ?? []).map((w) => ({
      ...w,
      english_alts: JSON.parse(w.english_alts) as string[],
      dutch_alts: JSON.parse(w.dutch_alts) as string[],
      dutch_past_forms: JSON.parse(w.dutch_past_forms) as string[],
      dutch_participle_forms: JSON.parse(w.dutch_participle_forms) as string[],
    }))
    return json({ data: words })
  }

  if (a === 'stats' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT user_id, word_id, direction, box, correct_count, wrong_count, streak, last_result, last_seen_at, due_at, updated_at FROM word_stats WHERE user_id = ?',
    ).bind(user.id).all<StatRow>()
    return json({ data: (results ?? []).map(rowToStat) })
  }

  if (a === 'attempt' && method === 'POST') {
    const input = readAttemptInput(await request.json())
    if (!input) return apiError('Invalid attempt payload.', 400)
    const word = await env.DB.prepare('SELECT id FROM words WHERE id = ?').bind(input.word_id).first()
    if (!word) return apiError('Unknown word.', 404)
    const prev = await env.DB.prepare(
      'SELECT box, streak, correct_count, wrong_count FROM word_stats WHERE user_id = ? AND word_id = ? AND direction = ?',
    ).bind(user.id, input.word_id, input.direction).first<{
      box: number; streak: number; correct_count: number; wrong_count: number;
    }>()
    const nowIso = new Date().toISOString()
    const next = computeAttemptUpdate(prev ?? null, input, user.id, nowIso)
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO attempts (user_id, word_id, direction, is_correct, typed_answer, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(user.id, input.word_id, input.direction, input.is_correct ? 1 : 0, input.typed_answer, nowIso),
      env.DB.prepare(
        `INSERT INTO word_stats (user_id, word_id, direction, box, correct_count, wrong_count, streak, last_result, last_seen_at, due_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, word_id, direction) DO UPDATE SET
           box = excluded.box, correct_count = excluded.correct_count, wrong_count = excluded.wrong_count,
           streak = excluded.streak, last_result = excluded.last_result, last_seen_at = excluded.last_seen_at,
           due_at = excluded.due_at, updated_at = excluded.updated_at`,
      ).bind(next.user_id, next.word_id, next.direction, next.box, next.correct_count, next.wrong_count, next.streak, next.last_result, next.last_seen_at, next.due_at, next.updated_at),
    ])
    return json({ data: { ...next, last_result: next.last_result === 1 } })
  }

  if (a === 'config' && method === 'GET') {
    const row = await env.DB.prepare('SELECT value FROM app_config WHERE key = ?').bind(b ?? '').first<{ value: string }>()
    return json({ data: row ?? null })
  }

  return apiError('Not found.', 404)
}
