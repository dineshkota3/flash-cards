// Generates d1/seed/*.sql from the InsForge JSON exports in d1/export/.
// Run: node d1/gen-seed.cjs
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

const EXPORT = path.join(__dirname, 'export')
const SEED = path.join(__dirname, 'seed')
fs.mkdirSync(SEED, { recursive: true })

const ITERATIONS = 20000
const load = (t) => JSON.parse(fs.readFileSync(path.join(EXPORT, t + '.json'), 'utf8')).rows
const q = (v) => `'${String(v).replace(/'/g, "''")}'`
const arr = (v) => q(JSON.stringify(v ?? []))
const bool = (v) => (v === true || v === 1 ? 1 : v === false || v === 0 ? 0 : 'NULL')
const nul = (v) => (v === null || v === undefined || v === '' ? 'NULL' : q(v))

const insertRows = (table, columns, rows) => {
  const stmts = []
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100).map((r) => `(${r.join(',')})`).join(',')
    stmts.push(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${chunk};`)
  }
  return stmts.join('\n')
}

// -- pepper + session secret (kept in a gitignored file for `wrangler secret put`).
//    Reuses an existing deploy-secrets.txt so re-running keeps hashes verifiable.
const secretsFile = path.join(EXPORT, 'deploy-secrets.txt')
let pepper = crypto.randomBytes(32).toString('base64url')
let sessionSecret = crypto.randomBytes(32).toString('base64url')
if (fs.existsSync(secretsFile)) {
  const text = fs.readFileSync(secretsFile, 'utf8')
  const existingPepper = text.match(/PEPPER=(.*)/)?.[1]?.trim()
  const existingSecret = text.match(/SESSION_SECRET=(.*)/)?.[1]?.trim()
  if (existingPepper) pepper = existingPepper
  if (existingSecret) sessionSecret = existingSecret
}
fs.writeFileSync(secretsFile, `PEPPER=${pepper}\nSESSION_SECRET=${sessionSecret}\n`)

// -- users: reuse InsForge UUIDs so word_stats/attempts import with no remapping.
//    Password comes from SEED_PASSWORD env (never committed); default is random.
const authUsers = load('auth-users').filter((u) => u.email !== 'cookie-probe@example.com')
const members = load('app_members')
const memberIds = new Set(members.map((m) => m.user_id))
const seedPassword = process.env.SEED_PASSWORD ?? crypto.randomBytes(9).toString('base64url')
const tempPasswords = []
const userRows = authUsers.map((u) => {
  const temp = seedPassword
  tempPasswords.push(`${u.email}: ${temp}`)
  const salt = crypto.randomBytes(16)
  const hash = crypto.pbkdf2Sync(pepper + temp, salt, ITERATIONS, 32, 'sha256')
  const stored = `pbkdf2_sha256$${ITERATIONS}$${salt.toString('base64url')}$${hash.toString('base64url')}`
  return [q(u.id), q(u.email), q(stored), q(u.created_at)]
})
fs.writeFileSync(
  path.join(SEED, '001-users.sql'),
  `DELETE FROM users;\n` + insertRows('users', ['id', 'email', 'password_hash', 'created_at'], userRows) + '\n',
)

// -- app_members re-keyed to email
const memberRows = members
  .map((m) => authUsers.find((u) => u.id === m.user_id))
  .filter(Boolean)
  .map((u) => [q(u.email), q(u.created_at ?? new Date().toISOString())])
fs.writeFileSync(
  path.join(SEED, '002-app-members.sql'),
  insertRows('app_members', ['email', 'added_at'], memberRows) + '\n',
)

// -- words (ids preserved; arrays become JSON strings)
const words = load('words')
const wordRows = words.map((w) => [
  w.id, q(w.english), q(w.dutch), q(w.category),
  arr(w.english_alts), arr(w.dutch_alts), arr(w.dutch_past_forms), arr(w.dutch_participle_forms), q(w.created_at),
])
fs.writeFileSync(
  path.join(SEED, '010-words.sql'),
  insertRows('words', ['id', 'english', 'dutch', 'category', 'english_alts', 'dutch_alts', 'dutch_past_forms', 'dutch_participle_forms', 'created_at'], wordRows) + '\n',
)

// -- word_stats (booleans 0/1)
const stats = load('word_stats')
const statRows = stats.map((s) => [
  q(s.user_id), s.word_id, q(s.direction), s.box, s.correct_count, s.wrong_count, s.streak,
  bool(s.last_result), nul(s.last_seen_at), q(s.due_at), q(s.updated_at ?? s.due_at),
])
fs.writeFileSync(
  path.join(SEED, '020-word-stats.sql'),
  insertRows('word_stats', ['user_id', 'word_id', 'direction', 'box', 'correct_count', 'wrong_count', 'streak', 'last_result', 'last_seen_at', 'due_at', 'updated_at'], statRows) + '\n',
)

// -- attempts
const attempts = load('attempts')
const attemptRows = attempts.map((a) => [
  'NULL', q(a.user_id), a.word_id, q(a.direction), bool(a.is_correct), nul(a.typed_answer), q(a.created_at),
])
fs.writeFileSync(
  path.join(SEED, '030-attempts.sql'),
  insertRows('attempts', ['id', 'user_id', 'word_id', 'direction', 'is_correct', 'typed_answer', 'created_at'], attemptRows) + '\n',
)

// -- app_config
const config = load('app_config')
const configRows = config.map((c) => [q(c.key), q(c.value), q(c.updated_at)])
fs.writeFileSync(
  path.join(SEED, '040-app-config.sql'),
  insertRows('app_config', ['key', 'value', 'updated_at'], configRows) + '\n',
)

console.log(`users: ${userRows.length}, members: ${memberRows.length}, words: ${words.length}, stats: ${stats.length}, attempts: ${attempts.length}, config: ${configRows.length}`)
console.log('TEMP PASSWORDS (change via owner SQL later):')
tempPasswords.forEach((p) => console.log('  ' + p))
