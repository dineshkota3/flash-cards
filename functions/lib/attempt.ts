// The one server-truth write path, ported from the record_attempt RPC.
// Reads the current stats row, computes the promotion/due math with the SAME
// shared scheduler functions the client uses optimistically, and writes
// (attempt insert + stats upsert) as one atomic D1 batch.
//
// Concurrency note: D1 has no SELECT ... FOR UPDATE, so the read happens
// outside the batch. A concurrent write to the same (user_id, word_id,
// direction) row could lose one streak increment — unreachable in this app
// (one card at a time; the offline replay loop is strictly sequential).

import { nextProgress, BOX_INTERVALS_MS, MAX_BOX } from '../../src/lib/scheduler'
import type { Direction } from '../../src/lib/types'

export const DIRECTIONS: Direction[] = ['nl_en', 'en_nl', 'nl_past', 'nl_participle']

export function isDirection(value: unknown): value is Direction {
  return typeof value === 'string' && (DIRECTIONS as string[]).includes(value)
}

export interface AttemptInput {
  word_id: number
  direction: Direction
  is_correct: boolean
  typed_answer: string | null
}

export interface StatsRow {
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

export interface PrevStats {
  box: number
  streak: number
  correct_count: number
  wrong_count: number
}

export function computeAttemptUpdate(
  prev: PrevStats | null,
  input: AttemptInput,
  userId: string,
  nowIso: string,
): StatsRow {
  const { box, streak } = nextProgress(
    input.is_correct,
    prev?.box ?? 0,
    prev?.streak ?? 0,
  )
  const due = new Date(Date.parse(nowIso) + BOX_INTERVALS_MS[Math.min(box, MAX_BOX)])
  return {
    user_id: userId,
    word_id: input.word_id,
    direction: input.direction,
    box,
    correct_count: (prev?.correct_count ?? 0) + (input.is_correct ? 1 : 0),
    wrong_count: (prev?.wrong_count ?? 0) + (input.is_correct ? 0 : 1),
    streak,
    last_result: input.is_correct ? 1 : 0,
    last_seen_at: nowIso,
    due_at: due.toISOString(),
    updated_at: nowIso,
  }
}
