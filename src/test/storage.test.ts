import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadPendingAttempts,
  savePendingAttempts,
  clearPendingAttempts,
  loadWordsCache,
  saveWordsCache,
  wordsSignature,
} from '../lib/storage'
import type { Word, WordStat } from '../lib/types'

const userA = 'user-a'
const userB = 'user-b'

const attemptA = { word_id: 1, direction: 'en_nl', is_correct: false, typed_answer: 'wrong' }

beforeEach(() => {
  localStorage.clear()
})

describe('pending attempts (offline buffer)', () => {
  it('stores and loads per user', () => {
    savePendingAttempts(userA, [attemptA])
    expect(loadPendingAttempts(userA)).toEqual([attemptA])
    expect(loadPendingAttempts(userB)).toEqual([])
  })

  it('never lets one user see another user’s queued attempts', () => {
    savePendingAttempts(userA, [attemptA])
    savePendingAttempts(userB, [{ ...attemptA, word_id: 2 }])
    expect(loadPendingAttempts(userA).map((a) => a.word_id)).toEqual([1])
    expect(loadPendingAttempts(userB).map((a) => a.word_id)).toEqual([2])
  })

  it('clears only attempts matching given stats', () => {
    savePendingAttempts(userA, [
      attemptA,
      { ...attemptA, word_id: 3, direction: 'nl_en' },
    ])
    const matching = [
      { word_id: 1, direction: 'en_nl' },
    ] as unknown as WordStat[]
    clearPendingAttempts(userA, matching)
    expect(loadPendingAttempts(userA).map((a) => a.word_id)).toEqual([3])
  })

  it('round-trips malformed JSON as empty', () => {
    localStorage.setItem(`pending_attempts_v1:${userA}`, '{not json')
    expect(loadPendingAttempts(userA)).toEqual([])
  })
})

describe('words cache', () => {
  const words: Word[] = [
    { id: 1, english: 'the', dutch: 'de', category: 'easy', english_alts: [], dutch_alts: [] },
    { id: 2, english: 'and', dutch: 'en', category: 'easy', english_alts: [], dutch_alts: [] },
  ]

  it('round-trips when the signature matches', () => {
    saveWordsCache(wordsSignature(words), words)
    expect(loadWordsCache(wordsSignature(words))).toEqual(words)
  })

  it('returns null when the signature differs (words changed)', () => {
    saveWordsCache(wordsSignature(words), words)
    expect(loadWordsCache('9:45')).toBeNull()
  })

  it('returns null on malformed cache', () => {
    localStorage.setItem('words_cache_v1', 'nope')
    expect(loadWordsCache(wordsSignature(words))).toBeNull()
  })
})
