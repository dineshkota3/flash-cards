import { describe, it, expect } from 'vitest'
import { parseVocabMd } from '../../scripts/import-vocab.mjs'

const FIXTURE = `# Dutch A2 – Reading Vocabulaire: all vocabulary

## COMMON WORDS – Easy (3 words)

| # | English | Dutch |
|---|---------|-------|
| 1 | the | de |
| 2 | tree | boom, de |
| 3 | very | zeer, heel |
| 4 | very | heel |

## COMMON WORDS – Medium (2 words)

| # | English | Dutch |
|---|---------|-------|
| 1 | from / of | van |
| 2 | our | ons/onze |
| 3 | tree | boom, de |
| 4 | from / of | van |

## VERBS – Common verbs (1 word)

| # | English | Dutch |
|---|---------|-------|
| 1 | to have | hebben |
| 2 | to have | hebben |

## VERBS – Separable verbs (1 word)

| # | English | Dutch |
|---|---------|-------|
| 1 | to take along | meenemen |

## VERBS – Separable verbs: how they split in a sentence

| # | Infinitive | Example sentence (separated parts in **bold**) | English |
|---|-----------|------------------------------------------------|---------|
| 1 | meenemen | Ik **neem** mijn tas **mee**. | I'm taking my bag along. |

## ADJECTIVES (2 words)

| # | English | Dutch |
|---|---------|-------|
| 1 | good, bad | goed, slecht |
| 2 | cheap, expensive | goedkoop, duur |

## PREPOSITIONS (1 word)

| # | English | Dutch |
|---|---------|-------|
| 1 | in front of, before | voor |
`

describe('parseVocabMd', () => {
  const result = parseVocabMd(FIXTURE)

  it('assigns categories from section headings (EN dash tolerant)', () => {
    const categories = result.words.map((w) => w.category)
    expect(categories).toContain('easy')
    expect(categories).toContain('medium')
    expect(categories).toContain('verb')
    expect(categories).toContain('separable_verb')
    expect(categories).toContain('adjective')
    expect(categories).toContain('preposition')
  })

  it('expands the article annotation into an alternative', () => {
    const tree = result.words.find((w) => w.english === 'tree')
    expect(tree?.dutch).toBe('boom')
    expect(tree?.dutch_alts).toEqual(['de boom'])
  })

  it('splits slash alternatives in the English column', () => {
    const from = result.words.find((w) => w.english === 'from')
    expect(from?.english_alts).toEqual(['of'])
  })

  it('splits slash alternatives in the Dutch column', () => {
    const our = result.words.find((w) => w.english === 'our')
    expect(our?.dutch).toBe('ons')
    expect(our?.dutch_alts).toEqual(['onze'])
  })

  it('keeps both "very" rows (different primary answers) and dedupes the exact repeat', () => {
    const verys = result.words.filter((w) => w.english === 'very')
    expect(verys).toHaveLength(2)
    expect(verys.map((v) => v.dutch).sort()).toEqual(['heel', 'zeer'])
    // the second "| 4 | from / of | van" row was dropped as an exact duplicate
    expect(result.dropped.some((d) => d.english === 'from' && d.dutch === 'van')).toBe(true)
  })

  it('dedupes across sections (first occurrence wins)', () => {
    expect(result.words.filter((w) => w.english === 'tree')).toHaveLength(1)
    expect(result.words.find((w) => w.english === 'tree')?.category).toBe('easy')
  })

  it('skips the example-sentence section entirely', () => {
    expect(result.words.every((w) => !w.english.includes("I'm taking"))).toBe(true)
    expect(result.skippedSections.some((s) => s.includes('how they split'))).toBe(true)
  })

  it('splits adjective antonym pairs into single-word entries', () => {
    expect(result.words.some((w) => w.english === 'good' && w.dutch === 'goed')).toBe(true)
    expect(result.words.some((w) => w.english === 'bad' && w.dutch === 'slecht')).toBe(true)
    expect(result.words.every((w) => !w.dutch.includes(','))).toBe(true)
  })

  it('never emits a comma-separated Dutch answer', () => {
    expect(result.words.every((w) => !w.dutch.includes(', '))).toBe(true)
  })

  it('reports per-category counts', () => {
    expect(result.perCategory).toMatchObject({
      easy: 4, // the, tree, zeer-very, heel-very
      medium: 2, // from, our
      verb: 1,
      separable_verb: 1,
      adjective: 4,
      preposition: 1,
    })
  })
})
