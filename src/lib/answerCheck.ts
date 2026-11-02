import type { CheckResult, Direction, Word } from './types'

/**
 * Normalize a typed answer for comparison:
 * trim → strip edge punctuation → lowercase → accent-fold (é→e) → collapse spaces.
 */
export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .replace(/^[.,;:!?"'()]+|[.,;:!?"'()]+$/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const ARTICLES = ['de', 'het', 'een']

function stripArticle(normalized: string): string | null {
  const first = normalized.split(' ')[0]
  if (ARTICLES.includes(first) && normalized.includes(' ')) {
    return normalized.slice(first.length + 1)
  }
  return null
}

/**
 * Every accepted normalized answer for a word in the given direction:
 * the canonical answer + its alternatives, each also available article-stripped
 * (so "de boom" ↔ "boom" match regardless of which form is canonical).
 */
export function acceptedAnswers(word: Word, direction: Direction): Set<string> {
  const raw = direction === 'nl_en' ? [word.english, ...word.english_alts] : [word.dutch, ...word.dutch_alts]
  const accepted = new Set<string>()
  for (const candidate of raw) {
    const normalized = normalizeAnswer(candidate)
    if (!normalized) continue
    accepted.add(normalized)
    const stripped = stripArticle(normalized)
    if (stripped) accepted.add(stripped)
  }
  return accepted
}

/** Check a typed answer against a word in the given direction. */
export function checkAnswer(
  typed: string,
  word: Word,
  direction: Direction,
): CheckResult {
  const canonical = direction === 'nl_en' ? word.english : word.dutch
  const normalizedTyped = normalizeAnswer(typed)
  const accepted = acceptedAnswers(word, direction)
  const strippedTyped = stripArticle(normalizedTyped)

  const correct =
    (normalizedTyped !== '' && accepted.has(normalizedTyped)) ||
    (strippedTyped !== null && accepted.has(strippedTyped))

  return { correct, canonical, typed }
}
