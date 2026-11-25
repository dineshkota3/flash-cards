// Thin same-origin API client. Response shapes mirror what the old SDK
// returned so AppContext/LoginScreen keep their logic: {data, error} where
// error is an Error with a user-presentable message.

import type { Direction, Word, WordStat } from './types'

export interface AppUser {
  id: string
  email: string
}

async function call<T>(path: string, init?: RequestInit): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
    })
    const body = (await res.json().catch(() => null)) as { data?: T; error?: string } | null
    if (!res.ok) {
      return { data: null, error: new Error(body?.error ?? `Request failed (${res.status})`) }
    }
    return { data: (body?.data ?? null) as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Network error') }
  }
}

export const api = {
  getCurrentUser(): Promise<{ data: { user: AppUser } | null; error: Error | null }> {
    return call<{ user: AppUser } | null>('/api/auth/me')
  },

  signInWithPassword(email: string, password: string): Promise<{ data: { user: AppUser } | null; error: Error | null }> {
    return call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },

  signUp(email: string, password: string): Promise<{ data: { user: AppUser } | null; error: Error | null }> {
    return call('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
  },

  async signOut(): Promise<{ error: Error | null }> {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    return res.ok ? { error: null } : { error: new Error('Sign out failed') }
  },

  getWords(): Promise<{ data: Word[] | null; error: Error | null }> {
    return call<Word[]>('/api/words')
  },

  getStats(): Promise<{ data: WordStat[] | null; error: Error | null }> {
    return call<WordStat[]>('/api/stats')
  },

  getConfig(key: string): Promise<{ data: { value: string } | null; error: Error | null }> {
    return call<{ value: string } | null>(`/api/config/${encodeURIComponent(key)}`)
  },

  recordAttempt(
    wordId: number,
    direction: Direction,
    isCorrect: boolean,
    typedAnswer: string,
  ): Promise<{ data: WordStat | null; error: Error | null }> {
    return call<WordStat>('/api/attempt', {
      method: 'POST',
      body: JSON.stringify({
        word_id: wordId,
        direction,
        is_correct: isCorrect,
        typed_answer: typedAnswer,
      }),
    })
  },
}
