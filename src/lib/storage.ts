import type { Word, WordStat } from './types'

/**
 * localStorage helpers: a words cache (saves a fetch on repeat visits) and an
 * offline buffer for attempts that failed to reach the server.
 * Keys are versioned so a schema change invalidates old caches, and the
 * pending-attempt buffer is PER USER so two accounts sharing one device can
 * never replay each other's answers.
 */

const WORDS_CACHE_KEY = 'words_cache_v1'
const pendingKey = (userId: string) => `pending_attempts_v1:${userId}`

interface WordsCache {
  signature: string
  words: Word[]
}

export function wordsSignature(words: Word[]): string {
  return `${words.length}:${words.reduce((a, w) => a + w.id, 0)}`
}

export function loadWordsCache(signature: string): Word[] | null {
  try {
    const raw = localStorage.getItem(WORDS_CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw) as WordsCache
    if (cache.signature !== signature) return null
    return cache.words
  } catch {
    return null
  }
}

export function saveWordsCache(signature: string, words: Word[]): void {
  try {
    localStorage.setItem(WORDS_CACHE_KEY, JSON.stringify({ signature, words }))
  } catch {
    // storage full/blocked — cache is an optimization, ignore
  }
}

export interface PendingAttempt {
  word_id: number
  direction: string
  is_correct: boolean
  typed_answer: string
}

export function loadPendingAttempts(userId: string): PendingAttempt[] {
  try {
    const raw = localStorage.getItem(pendingKey(userId))
    return raw ? (JSON.parse(raw) as PendingAttempt[]) : []
  } catch {
    return []
  }
}

export function savePendingAttempts(userId: string, attempts: PendingAttempt[]): void {
  try {
    localStorage.setItem(pendingKey(userId), JSON.stringify(attempts))
  } catch {
    // ignore — losing an offline retry buffer is acceptable
  }
}

/** Drop every pending attempt whose (word_id, direction) appears in these stats. */
export function clearPendingAttempts(userId: string, matching: WordStat[]): number {
  const done = new Set(matching.map((s) => `${s.word_id}:${s.direction}`))
  const remaining = loadPendingAttempts(userId).filter(
    (a) => !done.has(`${a.word_id}:${a.direction}`),
  )
  savePendingAttempts(userId, remaining)
  return remaining.length
}
