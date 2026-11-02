import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { TabBar } from '../components/TabBar'
import { MAX_BOX, boxIntervalLabel } from '../lib/scheduler'
import { statsKey, type Direction } from '../lib/types'

const DIRECTION_TITLES: Record<Direction, string> = {
  nl_en: 'Dutch → English',
  en_nl: 'English → Dutch',
}

/**
 * Words living in a single box level for one direction, Dutch and English
 * side by side. Reached by tapping a bar in the Stats histogram.
 */
export function BoxWordsScreen() {
  const { direction, box } = useParams<{ direction: Direction; box: string }>()
  const navigate = useNavigate()
  const { words, stats } = useApp()

  const valid =
    (direction === 'nl_en' || direction === 'en_nl') &&
    Number.isInteger(Number(box)) &&
    Number(box) >= 0 &&
    Number(box) <= MAX_BOX
  const boxNum = Number(box)

  const entries = useMemo(() => {
    if (!valid) return []
    return words
      .map((word) => ({ word, stat: stats.get(statsKey(word.id, direction)) ?? null }))
      .filter((e) => e.stat?.box === boxNum)
      .sort((a, b) => a.word.dutch.localeCompare(b.word.dutch))
  }, [valid, words, stats, direction, boxNum])

  if (!valid) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-iosgray">
        Unknown box level.
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex h-full w-full max-w-[26rem] flex-col">
        <header className="pt-safe flex items-center justify-between px-5 pb-1">
          <button onClick={() => navigate('/stats')} className="text-[17px] text-iosblue">
            ‹ Stats
          </button>
          <span className="text-[13px] font-medium text-iosgray">Box {boxNum}</span>
        </header>
        <div className="px-5 pb-3">
          <h1 className="text-[28px] font-bold leading-tight">{DIRECTION_TITLES[direction]}</h1>
          <p className="mt-0.5 text-[15px] text-iosgray">
            {entries.length} {entries.length === 1 ? 'word' : 'words'} · next review{' '}
            {boxIntervalLabel(boxNum)} after a correct answer
          </p>
        </div>
        <main className="flex-1 overflow-y-auto px-5 pb-24">
          {entries.length === 0 ? (
            <p className="mt-8 text-center text-iosgray">No words in this box yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {entries.map(({ word, stat }) => (
                <li
                  key={word.id}
                  className="flex items-center justify-between rounded-xl bg-ioscard px-4 py-2.5 shadow-sm ring-1 ring-black/5"
                >
                  <span className="font-semibold">{word.dutch}</span>
                  <span className="flex items-center gap-3 text-right">
                    <span className="text-iosgray">{word.english}</span>
                    <span className="text-[11px] font-medium text-iosgray">
                      {stat?.correct_count ?? 0}✓/{stat?.wrong_count ?? 0}✗
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
      <TabBar />
    </>
  )
}
