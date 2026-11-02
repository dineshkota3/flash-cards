import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PrimaryButton } from '../components/PrimaryButton'
import { Spinner } from '../components/Spinner'
import { buildSessionQueue, type Card } from '../lib/scheduler'
import { checkAnswer } from '../lib/answerCheck'
import type { Direction } from '../lib/types'

const SESSION_SIZE = 15
const REQUEUE_OFFSET = 3

type Phase = 'asking' | 'correct' | 'wrong' | 'summary'

/**
 * The session runner. Wrong answers get a copy of the card re-inserted a few
 * positions later and must be answered correctly once to finish; the session
 * summary reports first-try score and the mistake words.
 */
export function QuizScreen() {
  const { direction } = useParams<{ direction: Direction }>()
  const [searchParams] = useSearchParams()
  const pool = searchParams.get('pool') === 'review' ? 'review' : 'all'
  const navigate = useNavigate()
  const { words, stats, dataLoading, recordAnswer } = useApp()

  const inputRef = useRef<HTMLInputElement>(null)
  const [queue, setQueue] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [typed, setTyped] = useState('')
  const [canonical, setCanonical] = useState('')
  const [firstTryCorrect, setFirstTryCorrect] = useState(0)
  const [askedFirstTry, setAskedFirstTry] = useState(0)
  const [mistakes, setMistakes] = useState<Card[]>([])
  const startedRef = useRef(false)
  const seenWordsRef = useRef<Set<number>>(new Set())

  // Build the queue once per mount (words/stats must be loaded first).
  useEffect(() => {
    if (startedRef.current || dataLoading || words.length === 0) return
    startedRef.current = true
    const valid = direction === 'nl_en' || direction === 'en_nl'
    if (!valid) return
    setQueue(buildSessionQueue(words, stats, direction, { size: SESSION_SIZE, pool }))
  }, [dataLoading, words, stats, direction, pool])

  const card = queue[index]
  const prompt = useMemo(() => {
    if (!card) return ''
    return direction === 'nl_en' ? card.word.dutch : card.word.english
  }, [card, direction])

  // Session complete. This lives in an effect (not in advance()) so re-queue
  // insertions that grow the queue mid-flight can never trigger it early via
  // a stale closure.
  useEffect(() => {
    if (queue.length > 0 && index >= queue.length && phase !== 'summary') {
      setPhase('summary')
    }
  }, [index, queue.length, phase])

  // Refocus the input whenever a new card appears or feedback is dismissed.
  useEffect(() => {
    if (phase === 'asking' || phase === 'wrong') inputRef.current?.focus()
  }, [phase, index])

  if (!direction || (direction !== 'nl_en' && direction !== 'en_nl')) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-iosgray">
        Unknown quiz direction.
      </div>
    )
  }

  if (dataLoading || (words.length > 0 && queue.length === 0 && !startedRef.current)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-iosgray">Preparing your session…</p>
      </div>
    )
  }

  if (queue.length === 0 && startedRef.current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-[17px]">
          {pool === 'review'
            ? 'The review pile is empty — nicely done!'
            : 'No words available yet.'}
        </p>
        <PrimaryButton className="max-w-[16rem]" onClick={() => navigate('/')}>
          Back home
        </PrimaryButton>
      </div>
    )
  }

  if (phase === 'summary') {
    return (
      <div className="mx-auto flex h-full w-full max-w-[26rem] flex-col justify-center px-8 text-center">
        <div className="text-[64px] font-bold">{firstTryCorrect}</div>
        <p className="text-iosgray">
          of {askedFirstTry} first tries correct
          {mistakes.length > 0 ? ` · ${mistakes.length} reviewed in-session` : ''}
        </p>
        {mistakes.length > 0 && (
          <div className="mt-6 space-y-1.5 text-left">
            {mistakes.map((m) => (
              <div
                key={m.word.id}
                className="rounded-xl bg-ioscard px-4 py-2.5 text-[15px] shadow-sm ring-1 ring-black/5"
              >
                <span className="font-semibold">{m.word.dutch}</span>
                <span className="text-iosgray"> — {m.word.english}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 space-y-3">
          <PrimaryButton
            onClick={() => {
              const next = buildSessionQueue(words, stats, direction, {
                size: 10,
                pool,
              })
              setQueue(next)
              setIndex(0)
              setFirstTryCorrect(0)
              setAskedFirstTry(0)
              setMistakes([])
              seenWordsRef.current = new Set()
              setPhase('asking')
              setTyped('')
            }}
          >
            Continue (next 10)
          </PrimaryButton>
          <PrimaryButton variant="gray" onClick={() => navigate('/')}>
            Done
          </PrimaryButton>
        </div>
      </div>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!card || !direction || phase === 'correct' || phase === 'summary') return

    if (phase === 'wrong') {
      // Dismiss feedback and move on.
      advance()
      return
    }

    const result = checkAnswer(typed, card.word, direction)
    recordAnswer(card.word.id, direction, result.correct, typed)
    setCanonical(result.canonical)

    const isFirstView = !seenWordsRef.current.has(card.word.id)
    if (isFirstView) seenWordsRef.current.add(card.word.id)

    if (result.correct) {
      if (isFirstView) {
        setFirstTryCorrect((n) => n + 1)
        setAskedFirstTry((n) => n + 1)
      }
      setPhase('correct')
      window.setTimeout(() => advance(), 800)
    } else {
      if (isFirstView) setAskedFirstTry((n) => n + 1)
      setMistakes((prev) =>
        prev.some((m) => m.word.id === card.word.id) ? prev : [...prev, card],
      )
      // Re-insert a copy of the card a few positions later (mistake pile).
      setQueue((prev) => {
        const next = [...prev]
        const at = Math.min(index + REQUEUE_OFFSET, next.length)
        next.splice(at, 0, card)
        return next
      })
      setTyped('')
      setPhase('wrong')
    }
  }

  function advance() {
    setTyped('')
    setPhase('asking')
    setIndex((i) => i + 1)
  }

  const categoryLabel = card?.word.category.replace('_', ' ') ?? ''
  const progress = Math.round((index / queue.length) * 100)

  return (
    <div className="mx-auto flex h-full w-full max-w-[26rem] flex-col px-5">
      <div className="pt-safe">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => navigate('/')} className="text-[15px] text-iosblue">
            ✕
          </button>
          <span className="text-[13px] font-medium text-iosgray">
            {index + 1} / {queue.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-iosgray/20">
          <div
            className="h-full rounded-full bg-iosblue transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div key={card?.word.id} className="pop-in text-center">
          <div className="mb-3 inline-block rounded-full bg-iosgray/12 px-3 py-1 text-[13px] font-medium capitalize text-iosgray">
            {categoryLabel}
          </div>
          <div className="text-[40px] font-semibold leading-tight">{prompt}</div>
          {direction === 'nl_en' && card && (
            <div className="mt-2 text-[15px] text-iosgray">type the English meaning</div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pb-safe space-y-3">
        {phase === 'correct' && (
          <p className="rounded-xl bg-iosgreen/15 px-4 py-2.5 text-center text-[15px] font-medium text-iosgreen">
            Correct!
          </p>
        )}
        {phase === 'wrong' && (
          <p className="rounded-xl bg-iosred/10 px-4 py-2.5 text-center text-[15px]">
            <span className="font-semibold text-iosred">{canonical}</span>
            <span className="text-iosgray"> — tap Continue</span>
          </p>
        )}
        {phase === 'asking' && (
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            aria-label="Your answer"
            placeholder="Your answer…"
            className="answer-input w-full rounded-2xl border-0 bg-white px-4 py-4 shadow-sm outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-iosblue"
          />
        )}
        {phase !== 'correct' && (
          <PrimaryButton type="submit" variant={phase === 'wrong' ? 'blue' : 'blue'}>
            {phase === 'wrong' ? 'Continue' : 'Check'}
          </PrimaryButton>
        )}
      </form>
    </div>
  )
}
