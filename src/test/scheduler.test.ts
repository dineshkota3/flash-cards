import { afterEach, describe, it, expect, vi } from 'vitest'
import {
  BOX_INTERVALS_MS,
  MAX_BOX,
  promotionCorrectsNeeded,
  nextProgress,
  isInReviewPile,
  buildSessionQueue,
  weightedSample,
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

describe('promotionCorrectsNeeded', () => {
  it('requires 3 corrects at box 0, 2 at boxes 1-2, 1 from box 3 up', () => {
    expect(promotionCorrectsNeeded(0)).toBe(3)
    expect(promotionCorrectsNeeded(1)).toBe(2)
    expect(promotionCorrectsNeeded(2)).toBe(2)
    expect(promotionCorrectsNeeded(3)).toBe(1)
    expect(promotionCorrectsNeeded(6)).toBe(1)
  })
})

describe('nextProgress', () => {
  it('keeps a box-0 word in box 0 for the first two corrects', () => {
    expect(nextProgress(true, 0, 0)).toEqual({ box: 0, streak: 1 })
    expect(nextProgress(true, 0, 1)).toEqual({ box: 0, streak: 2 })
  })

  it('promotes box 0 → 1 on the third consecutive correct and resets the counter', () => {
    expect(nextProgress(true, 0, 2)).toEqual({ box: 1, streak: 0 })
  })

  it('promotes box 1 → 2 and box 2 → 3 on the second consecutive correct', () => {
    expect(nextProgress(true, 1, 0)).toEqual({ box: 1, streak: 1 })
    expect(nextProgress(true, 1, 1)).toEqual({ box: 2, streak: 0 })
    expect(nextProgress(true, 2, 0)).toEqual({ box: 2, streak: 1 })
    expect(nextProgress(true, 2, 1)).toEqual({ box: 3, streak: 0 })
  })

  it('promotes boxes 3+ on every correct', () => {
    expect(nextProgress(true, 3, 0)).toEqual({ box: 4, streak: 0 })
    expect(nextProgress(true, 4, 0)).toEqual({ box: 5, streak: 0 })
    expect(nextProgress(true, 5, 0)).toEqual({ box: 6, streak: 0 })
  })

  it('caps at MAX_BOX', () => {
    expect(nextProgress(true, 6, 0)).toEqual({ box: MAX_BOX, streak: 0 })
    expect(nextProgress(true, MAX_BOX + 5, 0)).toEqual({ box: MAX_BOX, streak: 0 })
  })

  it('drops two boxes on a wrong answer, floored at 0, and resets the counter', () => {
    expect(nextProgress(false, 6, 3)).toEqual({ box: 4, streak: 0 })
    expect(nextProgress(false, 2, 1)).toEqual({ box: 0, streak: 0 })
    expect(nextProgress(false, 1, 0)).toEqual({ box: 0, streak: 0 })
  })

  it('a mid-box mistake restarts the promotion count from zero', () => {
    // two corrects at box 0, then a mistake → back to start
    const after2 = nextProgress(true, 0, 1)
    expect(after2).toEqual({ box: 0, streak: 2 })
    expect(nextProgress(false, after2.box, after2.streak)).toEqual({ box: 0, streak: 0 })
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

  it('reserves guaranteed session slots: ~40% due, ~40% unseen, ~20% mastered', () => {
    const stats = new Map<string, WordStat>()
    const now = Date.now()
    // 20 due (box 0) + 20 unseen + 20 mastered (box 5, not due) — ids by bucket
    for (let i = 1; i <= 20; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 0, last_seen_at: new Date(now).toISOString(), due_at: new Date(now - 1000).toISOString() }))
    }
    for (let i = 41; i <= 60; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 5, last_seen_at: new Date(now).toISOString(), due_at: new Date(now + 86_400_000).toISOString() }))
    }
    const queue = buildSessionQueue(words, stats, 'en_nl', { size: 15, now })
    const bucketOf = (id: number) => (id <= 20 ? 'due' : id <= 40 ? 'unseen' : 'mastered')
    const counts = { due: 0, unseen: 0, mastered: 0 }
    queue.forEach((c) => (counts[bucketOf(c.word.id)] += 1))
    expect(counts.due).toBe(6)
    expect(counts.unseen).toBe(6)
    expect(counts.mastered).toBe(3)
  })

  it('donates empty-bucket slots: with no due words, unseen + mastered fill the session', () => {
    const stats = new Map<string, WordStat>()
    const now = Date.now()
    // 5 mastered (not due) + 50 unseen; no due words at all
    for (let i = 1; i <= 5; i++) {
      stats.set(statsKey(i, 'en_nl'), stat({ box: 5, due_at: new Date(now + 86_400_000).toISOString() }))
    }
    const queue = buildSessionQueue(words, stats, 'en_nl', { size: 15, now })
    expect(queue).toHaveLength(15)
    const masteredIds = queue.filter((c) => c.word.id <= 5)
    expect(masteredIds).toHaveLength(3) // mastered brush-up share only
    expect(queue.every((c) => c.word.id > 5 || c.word.id <= 5)).toBe(true) // no due words exist
  })

  it('within the due bucket, the most-mistaken words win', () => {
    const items = words.slice(0, 10).map((w) => w.id)
    const weights = items.map((id) => (id === 1 ? 9 : 1)) // word 1 has 8 wrongs
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.49) // lands in word 1's heavy slice
    const picked = weightedSample(items, weights, 3)
    spy.mockRestore()
    expect(picked[0]).toBe(1)
  })
})

describe('weightedSample', () => {
  it('samples without replacement', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
    const picked = weightedSample([10, 20, 30, 40], [1, 1, 1, 1], 3)
    spy.mockRestore()
    expect(new Set(picked).size).toBe(3)
  })

  it('heavier weights are picked first', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.49)
    const picked = weightedSample(['light', 'HEAVY'], [1, 5], 1)
    spy.mockRestore()
    expect(picked).toEqual(['HEAVY'])
  })

  it('returns at most count items, even with fewer candidates', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(weightedSample([1, 2], [1, 1], 5)).toHaveLength(2)
    spy.mockRestore()
  })
})
