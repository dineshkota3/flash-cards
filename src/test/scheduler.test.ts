import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  BOX_INTERVALS_MS,
  MAX_BOX,
  nextBox,
  cardWeight,
  isInReviewPile,
  buildSessionQueue,
} from '../lib/scheduler'
import { statsKey, type Word, type WordStat } from '../lib/types'

function makeWord(id: number): Word {
  return { id, english: `en${id}`, dutch: `nl${id}`, category: 'easy', english_alts: [], dutch_alts: [] }
}

function stat(partial: Partial<WordStat>): WordStat {
  return {
    word_id: 0,
    direction: 'en_nl',
    box: 0,
    correct_count: 0,
    wrong_count: 0,
    streak: 0,
    last_result: null,
    last_seen_at: null,
    due_at: new Date(Date.now() + 999_000).toISOString(),
    ...partial,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BOX_INTERVALS_MS', () => {
  it('starts at zero (immediately due) and rises monotonically', () => {
    expect(BOX_INTERVALS_MS[0]).toBe(0)
    for (let i = 1; i < BOX_INTERVALS_MS.length; i++) {
      expect(BOX_INTERVALS_MS[i]).toBeGreaterThan(BOX_INTERVALS_MS[i - 1])
    }
  })
})

describe('nextBox', () => {
  it('climbs one box per correct answer', () => {
    expect(nextBox(true, 0)).toBe(1)
    expect(nextBox(true, 3)).toBe(4)
  })

  it('caps at MAX_BOX', () => {
    expect(nextBox(true, MAX_BOX)).toBe(MAX_BOX)
    expect(nextBox(true, MAX_BOX + 5)).toBe(MAX_BOX)
  })

  it('drops two boxes on a wrong answer, floored at 0', () => {
    expect(nextBox(false, 6)).toBe(4)
    expect(nextBox(false, 1)).toBe(0)
    expect(nextBox(false, 0)).toBe(0)
  })
})

describe('cardWeight', () => {
  const now = Date.now()

  it('gives unseen words a fixed attractive weight', () => {
    expect(cardWeight({ word: makeWord(1), stat: null }, now)).toBe(6)
  })

  it('gives due words more weight the weaker they are', () => {
    const due = (box: number): WordStat => stat({ box, due_at: new Date(now - 1000).toISOString() })
    expect(cardWeight({ word: makeWord(1), stat: due(0) }, now)).toBeGreaterThan(
      cardWeight({ word: makeWord(2), stat: due(3) }, now),
    )
  })

  it('boosts due words with many wrong answers', () => {
    const base = stat({ box: 0, due_at: new Date(now - 1000).toISOString(), wrong_count: 0 })
    const failing = stat({ box: 0, due_at: new Date(now - 1000).toISOString(), wrong_count: 4 })
    expect(cardWeight({ word: makeWord(1), stat: failing }, now)).toBeGreaterThan(
      cardWeight({ word: makeWord(2), stat: base }, now),
    )
  })

  it('keeps not-due (mastered) words rare', () => {
    const mastered = stat({ box: 5, due_at: new Date(now + 86_400_000).toISOString() })
    const unseen = cardWeight({ word: makeWord(1), stat: null }, now)
    const brushUp = cardWeight({ word: makeWord(2), stat: mastered }, now)
    expect(brushUp).toBeLessThan(unseen / 10)
  })
})

describe('isInReviewPile', () => {
  it('excludes never-seen words', () => {
    expect(isInReviewPile(null)).toBe(false)
  })

  it('includes words at box 0 that have been seen', () => {
    expect(
      isInReviewPile(stat({ box: 0, last_seen_at: new Date().toISOString() })),
    ).toBe(true)
  })

  it('includes words with more wrongs than rights', () => {
    expect(isInReviewPile(stat({ box: 3, wrong_count: 3, correct_count: 1 }))).toBe(true)
  })

  it('includes words whose most recent attempt failed', () => {
    expect(isInReviewPile(stat({ box: 3, wrong_count: 1, correct_count: 5, last_result: false }))).toBe(true)
  })

  it('excludes healthy words', () => {
    expect(
      isInReviewPile(stat({ box: 5, wrong_count: 1, correct_count: 9, last_result: true })),
    ).toBe(false)
  })
})

describe('buildSessionQueue', () => {
  const words = Array.from({ length: 50 }, (_, i) => makeWord(i + 1))

  it('returns exactly `size` cards when enough candidates exist', () => {
    const queue = buildSessionQueue(words, new Map(), 'en_nl', { size: 15 })
    expect(queue).toHaveLength(15)
  })

  it('returns all candidates when fewer than `size` exist', () => {
    const queue = buildSessionQueue(words.slice(0, 4), new Map(), 'en_nl', { size: 15 })
    expect(queue).toHaveLength(4)
  })

  it('never repeats a word', () => {
    const queue = buildSessionQueue(words, new Map(), 'en_nl', { size: 20 })
    const ids = queue.map((c) => c.word.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('prefers due words over mastered ones', () => {
    const stats = new Map<string, WordStat>()
    const now = Date.now()
    const pool = words.slice(0, 15) // ids 1..15 — no unseen words in this comparison
    // 10 mastered (not due) + 5 due words
    for (let i = 1; i <= 10; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 6, due_at: new Date(now + 3_600_000).toISOString() }))
    }
    for (let i = 11; i <= 15; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 0, due_at: new Date(now - 1000).toISOString() }))
    }
    // Deterministic sampler: 0.999 picks from the heaviest weight slice (due words).
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const queue = buildSessionQueue(pool, stats, 'en_nl', { size: 15, now })
    spy.mockRestore()
    const firstFive = queue.slice(0, 5).map((c) => c.word.id)
    expect([...firstFive].sort()).toEqual([11, 12, 13, 14, 15])
  })

  it('restricts to the review pile in review mode', () => {
    const stats = new Map<string, WordStat>()
    const now = Date.now()
    for (let i = 1; i <= 10; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 0, last_seen_at: new Date(now).toISOString() }))
    }
    const queue = buildSessionQueue(words, stats, 'en_nl', { size: 15, pool: 'review', now })
    expect(queue).toHaveLength(10)
    expect(queue.every((c) => c.word.id <= 10)).toBe(true)
  })
})
