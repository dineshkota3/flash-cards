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

const BOX_LABELS = ['due now', '10 min', '1 hour', '6 hours', '1 day', '3 days', '7 days'] as const

/** Human label for the review interval of a box level. */
export function boxIntervalLabel(box: number): string {
  return BOX_LABELS[box] ?? ''
}

/**
 * Consecutive correct answers needed at the current box before promotion:
 * 3 to leave box 0 (the review pile), 2 for box 1→2 and box 2→3, then 1
 * per box from 3 upward. The counter resets when the word enters a box
 * (including on promotion) and on any mistake.
 */
export function promotionCorrectsNeeded(box: number): number {
  if (box === 0) return 3
  if (box <= 2) return 2
  return 1
}

/**
 * Progression for one answer: correct answers accumulate in the current box
 * until the promotion threshold is met (then box +1, counter reset); wrong
 * answers drop two boxes (floor 0) and reset the counter.
 */
export function nextProgress(
  correct: boolean,
  box: number,
  streak: number,
): { box: number; streak: number } {
  if (!correct) return { box: Math.max(box - 2, 0), streak: 0 }
  if (streak + 1 >= promotionCorrectsNeeded(box)) {
    return { box: Math.min(box + 1, MAX_BOX), streak: 0 }
  }
  return { box, streak: streak + 1 }
}

export type Card = { word: Word; stat: WordStat | null }

/** Session mix: ~40% weakest/due, ~40% new words, ~20% mastered brush-up. */
function bucketSlots(size: number): { due: number; unseen: number; mastered: number } {
  const due = Math.round(size * 0.4)
  const unseen = Math.round(size * 0.4)
  return { due, unseen, mastered: Math.max(0, size - due - unseen) }
}

/** Weighted sampling without replacement. Exported for tests. */
export function weightedSample<T>(items: T[], weights: number[], count: number): T[] {
  const pool = items.map((item, i) => ({ item, weight: weights[i] }))
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.weight, 0)
    let r = Math.random() * total
    let idx = pool.length - 1
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight
      if (r <= 0) {
        idx = i
        break
      }
    }
    picked.push(pool[idx].item)
    pool.splice(idx, 1)
  }
  return picked
}

/**
 * Build one session's queue. Candidates are stratified into three buckets so
 * struggling words always get a guaranteed share of the session even when the
 * unseen pool is huge:
 * - `due` (~40%): due_at <= now — weighted by wrong count (show-answers count
 *   as wrongs), so the most-mistaken words resurface the most and can climb
 *   out of the lower boxes.
 * - `unseen` (~40%): never-seen words enter rotation.
 * - `mastered` (~20%): not-due words, occasional brush-up.
 * Empty buckets donate their slots to the others (due first, then unseen).
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

  const unseen: Card[] = []
  const due: Card[] = []
  const mastered: Card[] = []
  for (const card of candidates) {
    const s = card.stat
    if (!s) unseen.push(card)
    else if (new Date(s.due_at).getTime() <= now) due.push(card)
    else mastered.push(card)
  }

  const slots = bucketSlots(size)
  let dueTake = Math.min(slots.due, due.length)
  let unseenTake = Math.min(slots.unseen, unseen.length)
  let masteredTake = Math.min(slots.mastered, mastered.length)
  // Empty buckets donate their slots: due first, then unseen, then mastered.
  let leftover = size - dueTake - unseenTake - masteredTake
  const extraDue = Math.min(leftover, due.length - dueTake)
  leftover -= extraDue
  dueTake += extraDue
  const extraUnseen = Math.min(leftover, unseen.length - unseenTake)
  leftover -= extraUnseen
  unseenTake += extraUnseen
  masteredTake += Math.min(leftover, mastered.length - masteredTake)

  const picked: Card[] = []
  const takeFrom = (cards: Card[], weightOf: (c: Card) => number, count: number) => {
    picked.push(...weightedSample(cards, cards.map(weightOf), count))
  }
  takeFrom(due, (c) => 1 + c.stat!.wrong_count, dueTake)
  takeFrom(unseen, () => 1, unseenTake)
  takeFrom(mastered, (c) => 1 / (1 + (c.stat?.box ?? 0)), masteredTake)

  return shuffle(picked)
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

export function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
