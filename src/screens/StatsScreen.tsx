import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Screen } from '../components/Screen'
import { TabBar } from '../components/TabBar'
import { MAX_BOX } from '../lib/scheduler'
import { statsKey, type Direction } from '../lib/types'

function DirectionStats({ title, direction }: { title: string; direction: Direction }) {
  const { words, stats } = useApp()
  const navigate = useNavigate()

  const s = useMemo(() => {
    const now = Date.now()
    const boxes = new Array(MAX_BOX + 1).fill(0)
    let seen = 0
    let correct = 0
    let wrong = 0
    let dueNow = 0
    for (const w of words) {
      const stat = stats.get(statsKey(w.id, direction))
      if (!stat) continue
      seen += 1
      boxes[stat.box] += 1
      correct += stat.correct_count
      wrong += stat.wrong_count
      if (new Date(stat.due_at).getTime() <= now) dueNow += 1
    }
    const attempts = correct + wrong
    return {
      boxes,
      seen,
      total: words.length,
      dueNow,
      accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
    }
  }, [words, stats, direction])

  const maxBox = Math.max(1, ...s.boxes)

  return (
    <section className="mt-5 rounded-3xl bg-ioscard p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-[20px] font-semibold">{title}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[22px] font-bold">
            {s.seen}
            <span className="text-[15px] font-normal text-iosgray">/{s.total}</span>
          </div>
          <div className="text-[12px] text-iosgray">words seen</div>
        </div>
        <div>
          <div className="text-[22px] font-bold">{s.accuracy === null ? '–' : `${s.accuracy}%`}</div>
          <div className="text-[12px] text-iosgray">accuracy</div>
        </div>
        <div>
          <div className="text-[22px] font-bold">{s.dueNow}</div>
          <div className="text-[12px] text-iosgray">due now</div>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1.5" aria-label="Words per box level">
        {s.boxes.map((count, box) => (
          <button
            key={box}
            type="button"
            disabled={count === 0}
            onClick={() => navigate(`/stats/${direction}/${box}`)}
            aria-label={`Box ${box}: ${count} words — view words`}
            className="pressable flex flex-1 flex-col items-center gap-1 disabled:opacity-40"
          >
            <div
              className={`w-full rounded-t-md ${box === 0 ? 'bg-iosred/70' : box === MAX_BOX ? 'bg-iosgreen/80' : 'bg-iosblue/70'}`}
              style={{ height: `${Math.max(3, (count / maxBox) * 64)}px` }}
              title={`Box ${box}: ${count}`}
            />
            <span className="text-[11px] text-iosgray">{box}</span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-center text-[12px] text-iosgray">
        box level (0 = review pile) — tap a bar to see its words
      </p>
    </section>
  )
}

export function StatsScreen() {
  return (
    <>
      <Screen title="Stats">
        <DirectionStats title="English → Dutch" direction="en_nl" />
        <DirectionStats title="Dutch → English" direction="nl_en" />
      </Screen>
      <TabBar />
    </>
  )
}
