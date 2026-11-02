// One-time import: parses the Dutch A2 vocab markdown into word rows and
// generates seed SQL for the InsForge `words` table.
//
// Run:  npm run import-vocab          (or: VOCAB_MD=/path/to/file.md node scripts/import-vocab.mjs)
// Then: npx -y @insforge/cli db query "$(cat data/seed-words-001.sql)"   (per batch)
//
// This script is a local dev tool — never shipped to the browser.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CATEGORIES = new Set([
  'easy',
  'medium',
  'difficult',
  'verb',
  'separable_verb',
  'adjective',
  'preposition',
])

const TABLE_HEADER_RE = /^\|\s*#\s*\|\s*English\s*\|\s*Dutch\s*\|/
const ROW_RE = /^\|\s*\d+\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/

function normalizeHeading(heading) {
  return heading
    .toLowerCase()
    .replace(/\s*[–-]\s*/g, ' - ')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim()
}

function categoryForHeading(heading) {
  const h = normalizeHeading(heading)
  if (h.includes('how they split')) return null // example-sentence section, not vocab
  if (h.startsWith('common words - easy')) return 'easy'
  if (h.startsWith('common words - medium')) return 'medium'
  if (h.startsWith('common words - difficult')) return 'difficult'
  if (h.startsWith('verbs - common verbs')) return 'verb'
  if (h.startsWith('verbs - separable verbs')) return 'separable_verb'
  if (h.startsWith('adjectives')) return 'adjective'
  if (h.startsWith('prepositions')) return 'preposition'
  return null
}

function splitAlternatives(cell) {
  return cell
    .split(/[,;/]/)
    .map((part) => part.replace(/\*\*/g, '').trim())
    .filter((part) => part.length > 0)
}

function parenVariants(part) {
  // "to come across (somebody)" also accepts "to come across"
  const stripped = part.replace(/\s*\([^)]*\)/g, '').trim()
  return stripped && stripped !== part ? [stripped] : []
}

const ARTICLE_TAIL_RE = /^(.+),\s*(de|het|een)$/

/**
 * Turn one (english, dutch) cell pair into 1..N word entries.
 */
function expandCellPair(englishCell, dutchCell, category) {
  const english = englishCell.replace(/\*\*/g, '').trim()
  const dutch = dutchCell.replace(/\*\*/g, '').trim()

  // Adjectives are antonym pairs ("good, bad | goed, slecht"): pair the parts
  // positionally so answers stay single words. Verified: equal-part rows only
  // exist in the ADJECTIVES section.
  const enParts = splitAlternatives(englishCell)
  const nlParts = splitAlternatives(dutchCell)
  if (category === 'adjective' && enParts.length > 1 && enParts.length === nlParts.length) {
    return enParts.flatMap((en, i) => {
      const nl = nlParts[i]
      const entry = { english: en, dutch: nl, category, english_alts: [], dutch_alts: [] }
      return [entry]
    })
  }

  const entry = { english, dutch, category, english_alts: [], dutch_alts: [] }

  // Article annotation: "boom, de" → dutch "boom", accept "de boom" too.
  const articleMatch = dutch.match(ARTICLE_TAIL_RE)
  if (articleMatch) {
    entry.dutch = articleMatch[1].trim()
    entry.dutch_alts.push(`${articleMatch[2]} ${entry.dutch}`)
  } else if (enParts.length === 1 && nlParts.length > 1) {
    entry.dutch = nlParts[0]
    entry.dutch_alts.push(...nlParts.slice(1))
  } else if (nlParts.length === 1 && enParts.length > 1) {
    entry.english = enParts[0]
    entry.english_alts.push(...enParts.slice(1))
  } else if (enParts.length > 1 && nlParts.length > 1) {
    // Defensive: unequal multi-part cells — keep whole cells, accept all parts.
    entry.english_alts.push(...enParts.filter((p) => p !== entry.english))
    entry.dutch_alts.push(...nlParts.filter((p) => p !== entry.dutch))
  }

  // Parenthetical variants: "(somebody)" optional parts.
  for (const part of [entry.english, ...entry.english_alts]) {
    for (const variant of parenVariants(part)) entry.english_alts.push(variant)
  }
  for (const part of [entry.dutch, ...entry.dutch_alts]) {
    for (const variant of parenVariants(part)) entry.dutch_alts.push(variant)
  }

  entry.english_alts = [...new Set(entry.english_alts.filter((a) => a !== entry.english))]
  entry.dutch_alts = [...new Set(entry.dutch_alts.filter((a) => a !== entry.dutch))]
  return [entry]
}

const dedupeKey = (entry) => `${entry.english.toLowerCase()}\u0000${entry.dutch.toLowerCase()}`

/**
 * Parse the markdown into word entries. Returns rows plus an audit trail.
 */
export function parseVocabMd(markdown) {
  const lines = markdown.split('\n')
  const words = []
  const dropped = []
  const skippedSections = []
  const perCategory = {}
  let currentCategory = null
  let inVocabTable = false

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      currentCategory = categoryForHeading(headingMatch[1])
      inVocabTable = false
      if (!currentCategory) skippedSections.push(headingMatch[1].trim())
      continue
    }
    if (TABLE_HEADER_RE.test(line)) {
      inVocabTable = currentCategory !== null
      continue
    }
    if (!inVocabTable || !currentCategory) continue

    const rowMatch = line.match(ROW_RE)
    if (!rowMatch) continue

    for (const entry of expandCellPair(rowMatch[1], rowMatch[2], currentCategory)) {
      const key = dedupeKey(entry)
      if (words.some((w) => w._key === key)) {
        dropped.push(entry)
        continue
      }
      entry._key = key
      words.push(entry)
      perCategory[entry.category] = (perCategory[entry.category] ?? 0) + 1
    }
  }

  return {
    words: words.map(({ _key, ...rest }) => rest),
    dropped,
    skippedSections,
    perCategory,
  }
}

function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlArray(values) {
  if (values.length === 0) return "'{}'"
  return `ARRAY[${values.map(sqlString).join(',')}]`
}

function seedSql(words, batchNumber) {
  const batchSize = 200
  const start = batchNumber * batchSize
  const batch = words.slice(start, start + batchSize)
  if (batch.length === 0) return null
  const rows = batch
    .map(
      (w) =>
        `  (${sqlString(w.english)}, ${sqlString(w.dutch)}, ${sqlString(w.category)}, ${sqlArray(w.english_alts)}, ${sqlArray(w.dutch_alts)})`,
    )
    .join(',\n')
  return `INSERT INTO public.words (english, dutch, category, english_alts, dutch_alts) VALUES\n${rows}\nON CONFLICT DO NOTHING;\n`
}

// --- CLI entry ---
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const vocabPath = process.env.VOCAB_MD ?? join(root, '..', 'dutch', 'a2-reading-vocabulaire-all-words.md')
  const markdown = readFileSync(vocabPath, 'utf8')
  const { words, dropped, skippedSections, perCategory } = parseVocabMd(markdown)

  mkdirSync(join(root, 'data'), { recursive: true })
  writeFileSync(join(root, 'data', 'words.json'), JSON.stringify(words, null, 2))

  const batches = []
  for (let i = 0; seedSql(words, i) !== null; i++) {
    const sql = seedSql(words, i)
    const file = join(root, 'data', `seed-words-${String(i + 1).padStart(3, '0')}.sql`)
    writeFileSync(file, sql)
    batches.push(file)
  }

  console.log(`Parsed ${words.length} unique words from ${vocabPath}`)
  console.log('Per category:', perCategory)
  console.log(`Dropped ${dropped.length} duplicates:`, dropped.map((d) => `${d.english} | ${d.dutch}`))
  console.log('Skipped sections:', skippedSections)
  console.log('Seed files:', batches)
}
