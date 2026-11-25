import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Direction, StatsKey, Word, WordStat } from '../lib/types'
import { statsKey } from '../lib/types'
import { api } from '../lib/api'
import { nextProgress, BOX_INTERVALS_MS } from '../lib/scheduler'
import {
  clearPendingAttempts,
  loadPendingAttempts,
  loadWordsCache,
  savePendingAttempts,
  saveWordsCache,
  type PendingAttempt,
} from '../lib/storage'

export interface AppContextValue {
  user: { id: string; email?: string } | null
  loading: boolean
  words: Word[]
  stats: Map<StatsKey, WordStat>
  dataLoading: boolean
  recordAnswer: (
    wordId: number,
    direction: Direction,
    isCorrect: boolean,
    typed: string,
  ) => void
  refreshStats: () => Promise<void>
  reloadUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

function optimisticStat(
  prev: WordStat | undefined,
  wordId: number,
  direction: Direction,
  isCorrect: boolean,
): WordStat {
  const { box, streak } = nextProgress(isCorrect, prev?.box ?? 0, prev?.streak ?? 0)
  const due = new Date(Date.now() + BOX_INTERVALS_MS[box])
  return {
    word_id: wordId,
    direction,
    box,
    correct_count: (prev?.correct_count ?? 0) + (isCorrect ? 1 : 0),
    wrong_count: (prev?.wrong_count ?? 0) + (isCorrect ? 0 : 1),
    streak,
    last_result: isCorrect,
    last_seen_at: new Date().toISOString(),
    due_at: due.toISOString(),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppContextValue['user']>(null)
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<Word[]>([])
  const [stats, setStats] = useState<Map<StatsKey, WordStat>>(new Map())
  const [dataLoading, setDataLoading] = useState(false)
  const bootstrappedFor = useRef<string | null>(null)

  // Rehydrate the session on cold load. `getCurrentUser()` uses the httpOnly
  // refresh cookie under the hood; `user` stays null during the round-trip,
  // so all gated UI must branch on `loading`, never on `user === null` alone.
  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      const { data, error } = await api.getCurrentUser()
      if (cancelled) return
      const u = error ? null : (data?.user ?? null)
      setUser(u ? { id: u.id, email: u.email } : null)
      setLoading(false)
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshStats = useCallback(async () => {
    const { data, error } = await api.getStats()
    if (error) return
    const next = new Map<StatsKey, WordStat>()
    for (const row of (data ?? []) as WordStat[]) {
      next.set(statsKey(row.word_id, row.direction), row)
    }
    setStats(next)
  }, [])

  // Re-run the session hydration after an in-page sign-in / sign-up.
  const reloadUser = useCallback(async () => {
    const { data, error } = await api.getCurrentUser()
    const u = error ? null : (data?.user ?? null)
    setUser(u ? { id: u.id, email: u.email } : null)
    setLoading(false)
  }, [])

  // Bootstrap after login: words (cached) + this user's stats + offline replay.
  // The `bootstrappedFor` ref is the only dedupe — no cancelled flag, because
  // React StrictMode's mount→cleanup→mount cycle in dev would otherwise drop
  // the single in-flight bootstrap forever.
  useEffect(() => {
    if (!user || bootstrappedFor.current === user.id) return
    bootstrappedFor.current = user.id
    const uid = user.id
    setDataLoading(true)
    async function bootstrap() {
      const cached = loadWordsCache('static-v3')
      if (cached) {
        setWords(cached)
      }
      if (!cached) {
        const { data, error } = await api.getWords()
        if (!error) {
          const fetched = (data ?? []) as Word[]
          setWords(fetched)
          saveWordsCache('static-v3', fetched)
        }
      }
      await refreshStats()
      // Replay any attempts queued while offline (same user only).
      const pending = loadPendingAttempts(uid)
      if (pending.length > 0) {
        const replayable = [...pending]
        const results: WordStat[] = []
        for (const attempt of replayable) {
          const { data: row } = await api.recordAttempt(
            attempt.word_id,
            attempt.direction as Direction, // runtime-validated server-side
            attempt.is_correct,
            attempt.typed_answer,
          )
          if (row) results.push(row)
        }
        clearPendingAttempts(uid, results)
        if (results.length > 0) {
          setStats((prev) => {
            const next = new Map(prev)
            for (const row of results) next.set(statsKey(row.word_id, row.direction), row)
            return next
          })
        }
      }
      setDataLoading(false)
    }
    void bootstrap()
  }, [user, refreshStats])

  const recordAnswer = useCallback(
    (wordId: number, direction: Direction, isCorrect: boolean, typed: string) => {
      if (!user) return
      const uid = user.id
      // Optimistic local update so the UI never waits on the network.
      setStats((prev) => {
        const next = new Map(prev)
        const key = statsKey(wordId, direction)
        next.set(key, optimisticStat(prev.get(key), wordId, direction, isCorrect))
        return next
      })
      void (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data, error } = await api.recordAttempt(wordId, direction, isCorrect, typed)
          if (!error) {
            const row = data as WordStat | null
            if (row) {
              setStats((prev) => {
                const next = new Map(prev)
                next.set(statsKey(wordId, direction), row)
                return next
              })
            }
            return
          }
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
        }
        // Server unreachable: queue for replay on next load (server-truth wins then).
        const queue = loadPendingAttempts(uid)
        queue.push({
          word_id: wordId,
          direction,
          is_correct: isCorrect,
          typed_answer: typed,
        } satisfies PendingAttempt)
        savePendingAttempts(uid, queue)
      })()
    },
    [user],
  )

  const signOut = useCallback(async () => {
    await api.signOut()
    bootstrappedFor.current = null
    setUser(null)
    setStats(new Map())
    setWords([])
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      words,
      stats,
      dataLoading,
      recordAnswer,
      refreshStats,
      reloadUser,
      signOut,
    }),
    [user, loading, words, stats, dataLoading, recordAnswer, refreshStats, reloadUser, signOut],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
