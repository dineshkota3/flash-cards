import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import { PrimaryButton } from '../components/PrimaryButton'
import { isInReviewPile } from '../lib/scheduler'
import { DIRECTION_TITLES, wordsForDirection, type VerbGroup } from '../lib/directions'
import { statsKey, type Direction, type Word, type WordStat } from '../lib/types'

function PileSection({
  direction,
  group,
  title,
  words,
  stats,
  onDrill,
}: {
  direction: Direction
  group?: VerbGroup
  title: string
  words: Word[]
  stats: Map<string, WordStat>
  onDrill: (direction: Direction, group?: VerbGroup) => void
}) {
  const pool = useMemo(
    () => wordsForDirection(words, direction, group),
    [words, direction, group],
  )
  const pile = useMemo(
    () =>
      pool
        .map((word) => ({ word, stat: stats.get(statsKey(word.id, direction)) ?? null }))
        .filter((entry) => isInReviewPile(entry.stat)),
    [pool, stats, direction],
  )

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        <PrimaryButton
          className="w-auto px-4 py-1.5 text-[14px]"
          onClick={() => onDrill(direction, group)}
          disabled={pile.length === 0}
        >
          Drill {pile.length > 0 ? `(${pile.length})` : ''}
        </PrimaryButton>
      </div>
      {pile.length === 0 ? (
        <p className="mt-2 text-[15px] text-iosgray">Nothing here — nicely done!</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {pile.map(({ word, stat }) => (
            <li
              key={word.id}
              className="flex items-center justify-between rounded-xl bg-ioscard px-4 py-2.5 shadow-sm ring-1 ring-black/5"
            >
              <div>
                <span className="font-semibold">{word.dutch}</span>
                <span className="text-iosgray"> — {word.english}</span>
              </div>
              <span className="text-[12px] font-medium text-iosgray">
                {stat ? `${stat.wrong_count}✗ / ${stat.correct_count}✓` : 'new'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Past-mode piles split by verb group so a drill never mixes pools.
const REVIEW_SECTIONS: { direction: Direction; group?: VerbGroup; title: string }[] = [
  { direction: 'en_nl', title: DIRECTION_TITLES.en_nl },
  { direction: 'nl_en', title: DIRECTION_TITLES.nl_en },
  { direction: 'nl_past', group: 'normal', title: 'Past tense (normal verbs)' },
  { direction: 'nl_past', group: 'separable', title: 'Past tense (separable verbs)' },
  { direction: 'nl_participle', group: 'normal', title: 'Past participle (normal verbs)' },
  { direction: 'nl_participle', group: 'separable', title: 'Past participle (separable verbs)' },
]

export function ReviewScreen() {
  const { words, stats } = useApp()
  const navigate = useNavigate()

  return (
    <>
      <Screen title="Review pile">
        {REVIEW_SECTIONS.map(({ direction, group, title }) => (
          <PileSection
            key={group ? `${direction}:${group}` : direction}
            direction={direction}
            group={group}
            title={title}
            words={words}
            stats={stats}
            onDrill={(drill, drillGroup) =>
              navigate(
                drillGroup
                  ? `/quiz/${drill}?pool=review&group=${drillGroup}`
                  : `/quiz/${drill}?pool=review`,
              )
            }
          />
        ))}
      </Screen>
      <TabBar />
    </>
  )
}
