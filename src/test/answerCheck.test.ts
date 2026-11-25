import { describe, it, expect } from 'vitest'
import { normalizeAnswer, acceptedAnswers, canonicalAnswer, checkAnswer } from '../lib/answerCheck'
import type { Word } from '../lib/types'

const word: Word = {
  id: 1,
  english: 'from',
  dutch: 'boom',
  category: 'medium',
  english_alts: ['of'],
  dutch_alts: ['de boom'],
  dutch_past_forms: [],
  dutch_participle_forms: [],
}

const accentWord: Word = {
  id: 2,
  english: 'very',
  dutch: 'één',
  category: 'easy',
  english_alts: [],
  dutch_alts: [],
  dutch_past_forms: [],
  dutch_participle_forms: [],
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

describe('past-tense directions', () => {
  const verb: Word = {
    id: 3,
    english: 'to work',
    dutch: 'werken',
    category: 'easy',
    english_alts: [],
    dutch_alts: [],
    dutch_past_forms: ['werkte', 'werkten'],
    dutch_participle_forms: ['gewerkt'],
  }

  it('nl_past accepts the singular and plural imperfectum, nothing else', () => {
    const accepted = acceptedAnswers(verb, 'nl_past')
    expect(accepted.has('werkte')).toBe(true)
    expect(accepted.has('werkten')).toBe(true)
    expect(accepted.has('gewerkt')).toBe(false)
    expect(accepted.has('werken')).toBe(false)
    expect(checkAnswer('WERKTEN', verb, 'nl_past').correct).toBe(true)
    expect(checkAnswer('gewerkt', verb, 'nl_past').correct).toBe(false)
  })

  it('nl_participle accepts only the participle', () => {
    const accepted = acceptedAnswers(verb, 'nl_participle')
    expect(accepted.has('gewerkt')).toBe(true)
    expect(accepted.has('werkte')).toBe(false)
    expect(checkAnswer('gewerkt', verb, 'nl_participle').correct).toBe(true)
    expect(checkAnswer('werkte', verb, 'nl_participle').correct).toBe(false)
  })

  it('canonical feedback is the first curated form', () => {
    expect(canonicalAnswer(verb, 'nl_past')).toBe('werkte')
    expect(canonicalAnswer(verb, 'nl_participle')).toBe('gewerkt')
    expect(checkAnswer('wrong', verb, 'nl_past').canonical).toBe('werkte')
  })

  it('a word without curated forms accepts nothing (defense in depth)', () => {
    expect(checkAnswer('werkte', word, 'nl_past').correct).toBe(false)
    expect(checkAnswer('gewerkt', word, 'nl_participle').correct).toBe(false)
    expect(canonicalAnswer(word, 'nl_past')).toBe('')
  })
})
