import { describe, it, expect } from 'vitest'
import { normalizeAnswer, acceptedAnswers, checkAnswer } from '../lib/answerCheck'
import type { Word } from '../lib/types'

const word: Word = {
  id: 1,
  english: 'from',
  dutch: 'boom',
  category: 'medium',
  english_alts: ['of'],
  dutch_alts: ['de boom'],
}

const accentWord: Word = {
  id: 2,
  english: 'very',
  dutch: 'één',
  category: 'easy',
  english_alts: [],
  dutch_alts: [],
}

describe('normalizeAnswer', () => {
  it('trims and lowercases', () => {
    expect(normalizeAnswer('  Boom ')).toBe('boom')
  })

  it('strips edge punctuation', () => {
    expect(normalizeAnswer('boom.')).toBe('boom')
    expect(normalizeAnswer('"boom"!')).toBe('boom')
  })

  it('folds accents', () => {
    expect(normalizeAnswer('één')).toBe('een')
    expect(normalizeAnswer('café')).toBe('cafe')
  })

  it('collapses internal whitespace', () => {
    expect(normalizeAnswer('de   boom')).toBe('de boom')
  })

  it('keeps internal punctuation like apostrophes and hyphens', () => {
    expect(normalizeAnswer("ik ben 't")).toBe("ik ben 't")
    expect(normalizeAnswer('e-mail')).toBe('e-mail')
  })
})

describe('acceptedAnswers', () => {
  it('includes the canonical answer and alternatives', () => {
    const en = acceptedAnswers(word, 'nl_en')
    expect(en.has('from')).toBe(true)
    expect(en.has('of')).toBe(true)
  })

  it('offers article-stripped variants for Dutch answers', () => {
    const nl = acceptedAnswers(word, 'en_nl')
    expect(nl.has('boom')).toBe(true)
    expect(nl.has('de boom')).toBe(true)
  })

  it('never accepts an empty string', () => {
    expect(acceptedAnswers(word, 'en_nl').has('')).toBe(false)
  })
})

describe('checkAnswer', () => {
  it('accepts the canonical answer case-insensitively', () => {
    expect(checkAnswer('BOOM', word, 'en_nl').correct).toBe(true)
  })

  it('accepts alternatives', () => {
    expect(checkAnswer('of', word, 'nl_en').correct).toBe(true)
  })

  it('accepts article-less Dutch for article-carrying answers', () => {
    expect(checkAnswer('boom', word, 'en_nl').correct).toBe(true)
  })

  it('accepts article-carrying Dutch even when canonical lacks the article', () => {
    expect(checkAnswer('de boom', word, 'en_nl').correct).toBe(true)
  })

  it('accepts accent differences', () => {
    expect(checkAnswer('een', accentWord, 'en_nl').correct).toBe(true)
    expect(checkAnswer('één', accentWord, 'en_nl').correct).toBe(true)
  })

  it('rejects wrong answers', () => {
    expect(checkAnswer('bomen', word, 'en_nl').correct).toBe(false)
    expect(checkAnswer('through', word, 'nl_en').correct).toBe(false)
  })

  it('rejects empty and whitespace answers', () => {
    expect(checkAnswer('', word, 'en_nl').correct).toBe(false)
    expect(checkAnswer('   ', word, 'en_nl').correct).toBe(false)
  })

  it('rejects an article-only answer', () => {
    expect(checkAnswer('de', word, 'en_nl').correct).toBe(false)
  })

  it('returns the canonical answer for feedback', () => {
    expect(checkAnswer('wrong', word, 'en_nl').canonical).toBe('boom')
    expect(checkAnswer('wrong', word, 'nl_en').canonical).toBe('from')
  })

  it('tolerates punctuation noise in typed input', () => {
    expect(checkAnswer('boom!', word, 'en_nl').correct).toBe(true)
  })
})
