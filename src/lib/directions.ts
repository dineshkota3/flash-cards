import type { Direction, Word } from './types'

export const DIRECTION_TITLES: Record<Direction, string> = {
  nl_en: 'Dutch → English',
  en_nl: 'English → Dutch',
  nl_past: 'Past tense',
  nl_participle: 'Past participle',
}

export function isPastDirection(d: Direction): boolean {
  return d === 'nl_past' || d === 'nl_participle'
}

/** Sub-pool for the past modes: normal verbs vs separable verbs. */
export type VerbGroup = 'normal' | 'separable'

export function parseVerbGroup(value: string | null | undefined): VerbGroup | undefined {
  return value === 'normal' || value === 'separable' ? value : undefined
}

/** What is shown as the prompt for a card in this direction. */
export function promptFor(word: Word, direction: Direction): string {
  switch (direction) {
    case 'nl_en':
    case 'nl_past':
    case 'nl_participle':
      return word.dutch
    case 'en_nl':
      return word.english
  }
}

/** Hint under the prompt; '' hides it. */
export function hintFor(direction: Direction): string {
  switch (direction) {
    case 'nl_en':
      return 'type the English meaning'
    case 'nl_past':
      return 'type the past tense'
    case 'nl_participle':
      return 'type the past participle'
    case 'en_nl':
      return ''
  }
}

/** Chip label shown next to the category for past modes; '' hides it. */
export function chipFor(direction: Direction): string {
  switch (direction) {
    case 'nl_past':
      return 'past tense'
    case 'nl_participle':
      return 'participle'
    case 'nl_en':
    case 'en_nl':
      return ''
  }
}

/** The Dutch text to speak for a card (the prompted form in every direction). */
export function speakText(word: Word, direction: Direction): string {
  return promptFor(word, direction)
}

/**
 * Words eligible for a direction's sessions/counts/totals: the Dutch-form
 * modes serve only verbs whose forms were curated, optionally restricted to
 * normal verbs or separable verbs.
 */
export function wordsForDirection(words: Word[], direction: Direction, group?: VerbGroup): Word[] {
  let pool: Word[]
  switch (direction) {
    case 'nl_past':
      pool = words.filter((w) => w.dutch_past_forms.length > 0)
      break
    case 'nl_participle':
      pool = words.filter((w) => w.dutch_participle_forms.length > 0)
      break
    case 'nl_en':
    case 'en_nl':
      return words
  }
  if (group === 'separable') return pool.filter((w) => w.category === 'separable_verb')
  if (group === 'normal') return pool.filter((w) => w.category !== 'separable_verb')
  return pool
}
