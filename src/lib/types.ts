export type Direction = 'nl_en' | 'en_nl'

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
