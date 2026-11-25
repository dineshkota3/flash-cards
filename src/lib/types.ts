export type Direction = 'nl_en' | 'en_nl' | 'nl_past' | 'nl_participle'

export type Category =
  | 'easy'
  | 'medium'
  | 'difficult'
  | 'verb'
  | 'separable_verb'
  | 'adjective'
  | 'preposition'

export interface Word {
  id: number
  english: string
  dutch: string
  category: Category
  english_alts: string[]
  dutch_alts: string[]
  /** Imperfectum, canonical singular first (empty for non-verbs). */
  dutch_past_forms: string[]
  /** Voltooid deelwoord, variants after (empty for non-verbs). */
  dutch_participle_forms: string[]
}

export interface WordStat {
  word_id: number
  direction: Direction
  box: number
  correct_count: number
  wrong_count: number
  streak: number
  last_result: boolean | null
  last_seen_at: string | null
  due_at: string
}

export type StatsKey = string // `${word_id}:${direction}`

export function statsKey(wordId: number, direction: Direction): StatsKey {
  return `${wordId}:${direction}`
}

export interface CheckResult {
  correct: boolean
  canonical: string
  typed: string
}
