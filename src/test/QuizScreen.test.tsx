import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QuizScreen } from '../screens/QuizScreen'
import { useApp } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'
import type { Word } from '../lib/types'

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}))

const recordAnswer = vi.fn()
const mockedUseApp = vi.mocked(useApp)

const word: Word = {
  id: 42,
  english: 'tree',
  dutch: 'boom',
  category: 'medium',
  english_alts: [],
  dutch_alts: ['de boom'],
  dutch_past_forms: [],
  dutch_participle_forms: [],
}

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={['/quiz/nl_en']}>
      <Routes>
        <Route path="/quiz/:direction" element={<QuizScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

function mockApp() {
  mockedUseApp.mockReturnValue({
    words: [word],
    stats: new Map(),
    dataLoading: false,
    recordAnswer,
  } as unknown as AppContextValue)
}

describe('QuizScreen', () => {
  it('shows the answer button during asking phase', () => {
    mockApp()
    recordAnswer.mockClear()
    renderQuiz()
    expect(screen.getByRole('button', { name: 'Show answer' })).toBeInTheDocument()
  })

  it('reveals the answer and records it as a miss (box 0)', async () => {
    const user = userEvent.setup()
    mockApp()
    recordAnswer.mockClear()
    renderQuiz()
    await user.click(screen.getByRole('button', { name: 'Show answer' }))
    // recorded as incorrect with no typed answer → server puts it in box 0
    expect(recordAnswer).toHaveBeenCalledWith(42, 'nl_en', false, '')
    // the canonical answer is revealed (English for the nl_en direction)
    expect(screen.getByText('tree')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show answer' })).not.toBeInTheDocument()
  })

  it('accepting a correct answer records success', async () => {
    const user = userEvent.setup()
    mockApp()
    recordAnswer.mockClear()
    renderQuiz()
    await user.type(screen.getByLabelText('Your answer'), 'tree{Enter}')
    expect(recordAnswer).toHaveBeenCalledWith(42, 'nl_en', true, 'tree')
    expect(screen.getByText('Correct!')).toBeInTheDocument()
  })
})

describe('QuizScreen past-tense modes', () => {
  const verb: Word = {
    ...word,
    id: 7,
    english: 'to work',
    dutch: 'werken',
    dutch_alts: [],
    dutch_past_forms: ['werkte', 'werkten'],
    dutch_participle_forms: ['gewerkt'],
  }

  function renderPastQuiz(direction: 'nl_past' | 'nl_participle') {
    mockedUseApp.mockReturnValue({
      words: [word, verb],
      stats: new Map(),
      dataLoading: false,
      recordAnswer,
    } as unknown as AppContextValue)
    return render(
      <MemoryRouter initialEntries={[`/quiz/${direction}`]}>
        <Routes>
          <Route path="/quiz/:direction" element={<QuizScreen />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('prompts the infinitive with a past-tense chip and hint, filters to verbs', () => {
    recordAnswer.mockClear()
    renderPastQuiz('nl_past')
    expect(screen.getByText('werken')).toBeInTheDocument()
    expect(screen.getByText('past tense')).toBeInTheDocument()
    expect(screen.getByText('type the past tense')).toBeInTheDocument()
    // the non-verb word is never prompted in past modes
    expect(screen.queryByText('boom')).not.toBeInTheDocument()
  })

  it('accepting the past form records the attempt under nl_past', async () => {
    const user = userEvent.setup()
    recordAnswer.mockClear()
    renderPastQuiz('nl_past')
    await user.type(screen.getByLabelText('Your answer'), 'werkte{Enter}')
    expect(recordAnswer).toHaveBeenCalledWith(7, 'nl_past', true, 'werkte')
  })

  it('participle mode chips "participle" and shows the canonical on show-answer', async () => {
    const user = userEvent.setup()
    recordAnswer.mockClear()
    renderPastQuiz('nl_participle')
    expect(screen.getByText('participle')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show answer' }))
    expect(recordAnswer).toHaveBeenCalledWith(7, 'nl_participle', false, '')
    expect(screen.getByText('gewerkt')).toBeInTheDocument()
  })
})
