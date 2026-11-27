import { describe, it, expect } from 'vitest'
import { parseVerbGroup, promptFor, hintFor, chipFor, wordsForDirection } from '../lib/directions'
import type { Word } from '../lib/types'

function word(id: number, category: Word['category'], dutch = `nl${id}`): Word {
  return {
    id, english: `to ${dutch}`, dutch, category,
    english_alts: [], dutch_alts: [],
    dutch_past_forms: category === 'separable_verb' || category === 'verb' || id % 2 === 0 ? ['verlede'] : [],
    dutch_participle_forms: category === 'separable_verb' || category === 'verb' || id % 2 === 0 ? ['geverleerd'] : [],
  }
}

const words = [
  word(1, 'verb'),
  word(2, 'separable_verb'),
  word(3, 'easy'),
  word(4, 'medium'), // odd id → no forms (a non-verb that happens to be even? 4 is even → has forms)
]

describe('wordsForDirection', () => {
  it('past modes serve only verbs with curated forms', () => {
    const pool = wordsForDirection(words, 'nl_past')
    expect(pool.map((w) => w.id).sort()).toEqual([1, 2, 4]) // id 3 (easy, odd) has no forms
  })

  it('group=separable keeps only separable verbs; group=normal excludes them', () => {
    expect(wordsForDirection(words, 'nl_past', 'separable').map((w) => w.id)).toEqual([2])
    expect(wordsForDirection(words, 'nl_past', 'normal').map((w) => w.id)).toEqual([1, 4])
  })

  it('the participle mode filters on its own form column', () => {
    const noParticiple: Word = { ...words[0]!, dutch_participle_forms: [] }
    expect(wordsForDirection([noParticiple], 'nl_participle')).toEqual([])
    expect(wordsForDirection([noParticiple], 'nl_past').map((w) => w.id)).toEqual([1])
  })

  it('translation directions ignore the group and serve everything', () => {
    expect(wordsForDirection(words, 'nl_en', 'separable')).toHaveLength(4)
    expect(wordsForDirection(words, 'en_nl')).toHaveLength(4)
  })
})

describe('parseVerbGroup', () => {
  it('accepts only normal/separable', () => {
    expect(parseVerbGroup('separable')).toBe('separable')
    expect(parseVerbGroup('normal')).toBe('normal')
    expect(parseVerbGroup('hacked')).toBeUndefined()
    expect(parseVerbGroup(null)).toBeUndefined()
  })
})

describe('prompt/hint/chip per direction', () => {
  const w = words[0]!
  it('past modes prompt the infinitive with their own hints and chips', () => {
    expect(promptFor(w, 'nl_past')).toBe(w.dutch)
    expect(promptFor(w, 'nl_participle')).toBe(w.dutch)
    expect(hintFor('nl_past')).toBe('type the past tense')
    expect(hintFor('nl_participle')).toBe('type the past participle')
    expect(chipFor('nl_past')).toBe('past tense')
    expect(chipFor('nl_participle')).toBe('participle')
  })
})
