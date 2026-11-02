import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import { PrimaryButton } from '../components/PrimaryButton'
import { isInReviewPile } from '../lib/scheduler'
import { statsKey, type Direction, type Word, type WordStat } from '../lib/types'

function PileSection({
  title,
  direction,
  words,
  stats,
  onDrill,
}: {
  title: string
  direction: Direction
  words: Word[]
  stats: Map<string, WordStat>
  onDrill: (direction: Direction) => void
}) {
  const pile = useMemo(
    () =>
      words
        .map((word) => ({ word, stat: stats.get(statsKey(word.id, direction)) ?? null }))
        .filter((entry) => isInReviewPile(entry.stat)),
    [words, stats, direction],
  )

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold">{title}</h2>
        <PrimaryButton
          className="w-auto px-4 py-1.5 text-[14px]"
          onClick={() => onDrill(direction)}
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

export function ReviewScreen() {
  const { words, stats } = useApp()
  const navigate = useNavigate()

  return (
    <>
      <Screen title="Review pile">
        <PileSection
          title="English → Dutch"
          direction="en_nl"
          words={words}
          stats={stats}
          onDrill={(d) => navigate(`/quiz/${d}?pool=review`)}
        />
        <PileSection
          title="Dutch → English"
          direction="nl_en"
          words={words}
          stats={stats}
          onDrill={(d) => navigate(`/quiz/${d}?pool=review`)}
        />
      </Screen>
      <TabBar />
    </>
  )
}
