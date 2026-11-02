import type { Direction, Word, WordStat } from './types'
import { statsKey } from './types'

/**
 * Leitner boxes 0-6 with graduated intervals (ms).
 * Index = the box AFTER a correct answer; due time = now + BOX_INTERVALS_MS[box].
 * Box 0 is "in the pile": due immediately.
 */
export const BOX_INTERVALS_MS = [
  0, // box 0: immediately due
  600_000, // box 1: 10 min
  3_600_000, // box 2: 1 h
  21_600_000, // box 3: 6 h
  86_400_000, // box 4: 1 day
  259_200_000, // box 5: 3 days
  604_800_000, // box 6: 7 days (mastered)
] as const

export const MAX_BOX = BOX_INTERVALS_MS.length - 1

export function nextBox(correct: boolean, box: number): number {
  return correct ? Math.min(box + 1, MAX_BOX) : Math.max(box - 2, 0)
}

export type Card = { word: Word; stat: WordStat | null }

/**
 * Sampling weight for a card in the current-direction session.
 * - Unseen words: fixed attractive weight (they must enter rotation).
 * - Due words: weaker = heavier; repeated failures add extra weight.
 * - Not-due (mastering) words: tiny weight so learned words still pop up occasionally.
 */
export function cardWeight(card: Card, now: number): number {
  const s = card.stat
  if (!s) return 6
  if (new Date(s.due_at).getTime() <= now) {
    return 10 / (1 + s.box) + Math.min(s.wrong_count, 5)
  }
  return 0.3 / (1 + s.box)
}

/**
 * The persistent review pile: words that need dedicated drilling.
 * A word belongs if it is at the bottom of the ladder, has more wrongs than
 * rights, or its most recent attempt failed.
 */
export function isInReviewPile(s: WordStat | null | undefined): boolean {
  if (!s) return false
  const seen = s.last_seen_at !== null
  return (s.box === 0 && seen) || s.wrong_count > s.correct_count || s.last_result === false
}

export interface SessionOptions {
  size?: number
  pool?: 'all' | 'review'
  now?: number
}

/**
 * Build one session's queue: weighted sampling WITHOUT replacement over the
 * candidate pool, then shuffled. `pool: 'review'` restricts candidates to the
 * persistent review pile (drill mode).
 */
export function buildSessionQueue(
  words: Word[],
  stats: Map<string, WordStat>,
  direction: Direction,
  opts: SessionOptions = {},
): Card[] {
  const size = opts.size ?? 15
  const now = opts.now ?? Date.now()
  const pool = opts.pool ?? 'all'

  let candidates: Card[] = words.map((word) => ({
    word,
    stat: stats.get(statsKey(word.id, direction)) ?? null,
  }))
  if (pool === 'review') {
    candidates = candidates.filter((c) => isInReviewPile(c.stat))
  }

  const picked: Card[] = []
  const remaining = [...candidates]
  while (picked.length < size && remaining.length > 0) {
    const weights = remaining.map((c) => cardWeight(c, now))
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let idx = remaining.length - 1
    for (let i = 0; i < remaining.length; i++) {
      r -= weights[i]
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(remaining[idx])
    remaining.splice(idx, 1)
  }

  return shuffle(picked)
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
