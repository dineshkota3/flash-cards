import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import { isInReviewPile } from '../lib/scheduler'
import { wordsForDirection, type VerbGroup } from '../lib/directions'
import { statsKey, type Direction } from '../lib/types'

const MODES: { direction: Direction; group?: VerbGroup; title: string; subtitle: string }[] = [
  {
    direction: 'nl_en',
    title: 'Dutch → English',
    subtitle: 'See a Dutch word, type its meaning',
  },
  {
    direction: 'en_nl',
    title: 'English → Dutch',
    subtitle: 'See the meaning, type the Dutch word',
  },
  {
    direction: 'nl_past',
    title: 'Past tense',
    subtitle: 'Normal verbs: werken → werkte',
  },
  {
    direction: 'nl_past',
    group: 'separable',
    title: 'Past tense · separable',
    subtitle: 'Separable verbs: meenemen → nam mee',
  },
  {
    direction: 'nl_participle',
    title: 'Past participle',
    subtitle: 'Normal verbs: werken → gewerkt',
  },
  {
    direction: 'nl_participle',
    group: 'separable',
    title: 'Past participle · separable',
    subtitle: 'Separable verbs: meenemen → meegenomen',
  },
]

function ModeCard({
  title,
  subtitle,
  due,
  onClick,
}: {
  title: string
  subtitle: string
  due: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="pressable w-full rounded-3xl bg-ioscard p-5 text-left shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[20px] font-semibold">{title}</div>
          <div className="mt-0.5 text-[15px] text-iosgray">{subtitle}</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
            due > 0 ? 'bg-nl/15 text-nl' : 'bg-iosgreen/15 text-iosgreen'
          }`}
        >
          {due > 0 ? `${due} due` : 'all caught up'}
        </div>
      </div>
    </button>
  )
}

export function HomeScreen() {
  const { words, stats, user, dataLoading, signOut } = useApp()
  const navigate = useNavigate()

  const counts = useMemo(() => {
    const now = Date.now()
    const countFor = (direction: Direction, group?: VerbGroup) =>
      wordsForDirection(words, direction, group).filter((w) => {
        const s = stats.get(statsKey(w.id, direction))
        return !s || new Date(s.due_at).getTime() <= now
      }).length
    const pile = words.filter((w) =>
      MODES.some((m) => isInReviewPile(stats.get(statsKey(w.id, m.direction)))),
    ).length
    const keys = MODES.map((m) => (m.group ? `${m.direction}:${m.group}` : m.direction))
    return {
      ...Object.fromEntries(MODES.map((m, i) => [keys[i], countFor(m.direction, m.group)])),
      pile,
    } as Record<string, number>
  }, [words, stats])

  return (
    <>
      <Screen
        title="Practice"
        right={
          <button
            onClick={() => void signOut()}
            className="pb-1 text-[15px] text-iosblue"
            aria-label="Sign out"
          >
            Sign out
          </button>
        }
      >
        {dataLoading && words.length === 0 ? (
          <p className="mt-10 text-center text-iosgray">Loading your words…</p>
        ) : (
          <div className="mt-4 space-y-4">
            {MODES.map((m) => (
              <ModeCard
                key={m.group ? `${m.direction}:${m.group}` : m.direction}
                title={m.title}
                subtitle={m.subtitle}
                due={counts[m.group ? `${m.direction}:${m.group}` : m.direction] ?? 0}
                onClick={() =>
                  navigate(m.group ? `/quiz/${m.direction}?group=${m.group}` : `/quiz/${m.direction}`)
                }
              />
            ))}
            <button
              onClick={() => navigate('/review')}
              className="pressable w-full rounded-3xl bg-ioscard p-5 text-left shadow-sm ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[20px] font-semibold">Review pile</div>
                  <div className="mt-0.5 text-[15px] text-iosgray">
                    Words that need another look
                  </div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                    counts.pile > 0 ? 'bg-iosred/15 text-iosred' : 'bg-iosgreen/15 text-iosgreen'
                  }`}
                >
                  {counts.pile}
                </div>
              </div>
            </button>
            {user?.email && (
              <p className="pt-2 text-center text-[13px] text-iosgray">{user.email}</p>
            )}
          </div>
        )}
      </Screen>
      <TabBar />
    </>
  )
}
