-- Dutch flashcards — Cloudflare D1 (SQLite) schema.
-- Ported from the InsForge Postgres schema: TEXT[] columns hold JSON, booleans
-- are 0/1, timestamps are ISO-8601 TEXT written by the API (no defaults that
-- emit non-ISO formats). Seeds preserve the original InsForge ids so
-- word_stats/attempts keep referencing the same words.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE app_members (
  email TEXT PRIMARY KEY,
  added_at TEXT NOT NULL
);

CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  english TEXT NOT NULL CHECK (trim(english) <> ''),
  dutch TEXT NOT NULL CHECK (trim(dutch) <> ''),
  category TEXT NOT NULL CHECK (category IN
    ('easy', 'medium', 'difficult', 'verb', 'separable_verb', 'adjective', 'preposition')),
  english_alts TEXT NOT NULL DEFAULT '[]',
  dutch_alts TEXT NOT NULL DEFAULT '[]',
  dutch_past_forms TEXT NOT NULL DEFAULT '[]',
  dutch_participle_forms TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX words_unique_pair ON words (lower(english), lower(dutch));

CREATE TABLE word_stats (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en', 'en_nl', 'nl_past', 'nl_participle')),
  box INTEGER NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 6),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_result INTEGER CHECK (last_result IN (0, 1)),
  last_seen_at TEXT,
  due_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, word_id, direction)
);
CREATE INDEX idx_word_stats_due ON word_stats (user_id, direction, due_at);

CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en', 'en_nl', 'nl_past', 'nl_participle')),
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  typed_answer TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_attempts_user_time ON attempts (user_id, created_at DESC);

CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
