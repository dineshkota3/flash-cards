/// <reference types="@cloudflare/workers-types" />
import type { Direction, WordStat } from '../../src/lib/types'

export interface Env {
  DB: D1Database
  SESSION_SECRET: string
  PEPPER: string
}

export function json(data: unknown, status = 200, headers: HeadersInit = []): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(new Headers(headers)) },
  })
}

export function apiError(message: string, status: number): Response {
  return json({ error: message }, status)
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

/** Constant-time byte comparison (portable: Node webcrypto lacks workerd's timingSafeEqual). */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!
  return diff === 0
}

/** The stats row as the client expects it (booleans, not 0/1). */
export interface StatRow {
  user_id: string
  word_id: number
  direction: string
  box: number
  correct_count: number
  wrong_count: number
  streak: number
  last_result: number | null
  last_seen_at: string | null
  due_at: string
  updated_at: string
}

export function rowToStat(row: StatRow): WordStat {
  return {
    ...row,
    direction: row.direction as Direction,
    last_result: row.last_result === null ? null : row.last_result === 1,
  }
}
