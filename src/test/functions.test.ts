import { describe, it, expect } from 'vitest'
import { signSession, verifySession, SESSION_MAX_AGE } from '../../functions/lib/session'
import { hashPassword, verifyPassword } from '../../functions/lib/password'
import { computeAttemptUpdate, isDirection } from '../../functions/lib/attempt'
import { rowToStat, type StatRow } from '../../functions/lib/http'
import { BOX_INTERVALS_MS, MAX_BOX, nextProgress } from '../../src/lib/scheduler'

const SECRET = 'test-secret'

describe('session tokens', () => {
  it('round-trips a payload', async () => {
    const token = await signSession({ sub: 'u1', email: 'a@b.c', exp: 9999999999 }, SECRET)
    const payload = await verifySession(token, SECRET)
    expect(payload).toEqual({ sub: 'u1', email: 'a@b.c', exp: 9999999999 })
  })

  it('rejects tampered payloads and wrong secrets', async () => {
    const token = await signSession({ sub: 'u1', email: 'a@b.c', exp: 9999999999 }, SECRET)
    const [body] = token.split('.')
    expect(await verifySession(`${body}.deadbeef`, SECRET)).toBeNull()
    expect(await verifySession(token, 'other-secret')).toBeNull()
    expect(await verifySession('not-a-token', SECRET)).toBeNull()
  })

  it('rejects expired sessions', async () => {
    const token = await signSession({ sub: 'u1', email: 'a@b.c', exp: 1 }, SECRET)
    expect(await verifySession(token, SECRET)).toBeNull()
  })

  it('max age matches the 30-day cookie', () => {
    expect(SESSION_MAX_AGE).toBe(30 * 24 * 60 * 60)
  })
})

describe('password hashing', () => {
  it('round-trips and rejects wrong passwords', async () => {
    const hash = await hashPassword('correct horse', 'pepper-1')
    expect(await verifyPassword('correct horse', 'pepper-1', hash)).toBe(true)
    expect(await verifyPassword('wrong horse', 'pepper-1', hash)).toBe(false)
    expect(await verifyPassword('correct horse', 'pepper-2', hash)).toBe(false)
  })

  it('salts, so identical passwords produce different hashes', async () => {
    const a = await hashPassword('same', 'p')
    const b = await hashPassword('same', 'p')
    expect(a).not.toBe(b)
  })
})

describe('computeAttemptUpdate', () => {
  const input = (isCorrect: boolean) => ({
    word_id: 1,
    direction: 'nl_en' as const,
    is_correct: isCorrect,
    typed_answer: null,
  })
  const NOW = '2026-01-01T00:00:00.000Z'

  it('mirrors nextProgress for every box/streak/correct combination', () => {
    for (let box = 0; box <= 6; box++) {
      for (let streak = 0; streak <= 3; streak++) {
        for (const correct of [true, false]) {
          const row = computeAttemptUpdate({ box, streak, correct_count: 5, wrong_count: 2 }, input(correct), 'u1', NOW)
          expect(row.box).toBe(nextProgress(correct, box, streak).box)
          expect(row.streak).toBe(nextProgress(correct, box, streak).streak)
          expect(row.correct_count).toBe(5 + (correct ? 1 : 0))
          expect(row.wrong_count).toBe(2 + (correct ? 0 : 1))
        }
      }
    }
  })

  it('schedules due_at from the new box interval', () => {
    const promoted = computeAttemptUpdate({ box: 5, streak: 0, correct_count: 0, wrong_count: 0 }, input(true), 'u1', NOW)
    expect(promoted.box).toBe(6)
    expect(promoted.due_at).toBe(new Date(Date.parse(NOW) + BOX_INTERVALS_MS[MAX_BOX]).toISOString())
    const wrong = computeAttemptUpdate({ box: 0, streak: 0, correct_count: 0, wrong_count: 0 }, input(false), 'u1', NOW)
    expect(wrong.due_at).toBe(new Date(Date.parse(NOW) + BOX_INTERVALS_MS[0]).toISOString())
  })
})

describe('rowToStat', () => {
  const row = (last_result: number | null): StatRow => ({
    user_id: 'u1', word_id: 1, direction: 'nl_en', box: 2, correct_count: 3, wrong_count: 1,
    streak: 2, last_result, last_seen_at: null, due_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
  })

  // isInReviewPile checks last_result === false — 0/1 must never leak through.
  it('maps 0/1/null to false/true/null', () => {
    expect(rowToStat(row(1)).last_result).toBe(true)
    expect(rowToStat(row(0)).last_result).toBe(false)
    expect(rowToStat(row(null)).last_result).toBeNull()
  })
})

describe('isDirection', () => {
  it('accepts the four directions and nothing else', () => {
    for (const d of ['nl_en', 'en_nl', 'nl_past', 'nl_participle']) expect(isDirection(d)).toBe(true)
    for (const d of ['nl_EN', '', 'past', null, 42]) expect(isDirection(d)).toBe(false)
  })
})
