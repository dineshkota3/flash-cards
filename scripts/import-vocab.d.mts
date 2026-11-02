export interface ParsedWord {
  english: string
  dutch: string
  category: string
  english_alts: string[]
  dutch_alts: string[]
}

export interface ParseResult {
  words: ParsedWord[]
  dropped: ParsedWord[]
  skippedSections: string[]
  perCategory: Record<string, number>
}

export function parseVocabMd(markdown: string): ParseResult
