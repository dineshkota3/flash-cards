import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { BoxWordsScreen } from '../screens/BoxWordsScreen'
import { useApp } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'
import { statsKey, type Word, type WordStat } from '../lib/types'

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}))

const mockedUseApp = vi.mocked(useApp)

function makeWord(id: number, dutch: string, english: string): Word {
  return { id, english, dutch, category: 'easy', english_alts: [], dutch_alts: [] }
}

function stat(wordId: number, direction: 'nl_en' | 'en_nl', box: number): WordStat {
  return {
    word_id: wordId,
    direction,
    box,
    correct_count: 2,
    wrong_count: 1,
    streak: 1,
    last_result: true,
    last_seen_at: '2026-11-02T10:00:00Z',
    due_at: '2026-11-09T10:00:00Z',
  }
}

const words = [
  makeWord(1, 'boom', 'tree'),
  makeWord(2, 'huis', 'house'),
  makeWord(3, 'fiets', 'bicycle'),
]

const stats = new Map([
  [statsKey(1, 'en_nl'), stat(1, 'en_nl', 2)],
  [statsKey(2, 'en_nl'), stat(2, 'en_nl', 2)],
  [statsKey(3, 'en_nl'), stat(3, 'en_nl', 5)],
])

describe('BoxWordsScreen', () => {
  it('lists only the words in the requested box, Dutch and English side by side', () => {
    mockedUseApp.mockReturnValue({ words, stats } as unknown as AppContextValue)
    render(
      <MemoryRouter initialEntries={['/stats/en_nl/2']}>
        <Routes>
          <Route path="/stats/:direction/:box" element={<BoxWordsScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('boom')).toBeInTheDocument()
    expect(screen.getByText('tree')).toBeInTheDocument()
    expect(screen.getByText('huis')).toBeInTheDocument()
    expect(screen.getByText('house')).toBeInTheDocument()
    // box 5 word must not appear in a box-2 view
    expect(screen.queryByText('fiets')).not.toBeInTheDocument()
    expect(screen.getByText('2 words · next review 1 hour after a correct answer')).toBeInTheDocument()
  })

  it('offers a way back to the Stats page', () => {
    mockedUseApp.mockReturnValue({ words, stats } as unknown as AppContextValue)
    render(
      <MemoryRouter initialEntries={['/stats/en_nl/2']}>
        <Routes>
          <Route path="/stats/:direction/:box" element={<BoxWordsScreen />} />
          <Route path="/stats" element={<div>stats page</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('‹ Stats')).toBeInTheDocument()
    expect(screen.getByText('Box 2')).toBeInTheDocument()
  })

  it('shows an empty state when the box has no words', () => {
    mockedUseApp.mockReturnValue({ words, stats: new Map() } as unknown as AppContextValue)
    render(
      <MemoryRouter initialEntries={['/stats/nl_en/6']}>
        <Routes>
          <Route path="/stats/:direction/:box" element={<BoxWordsScreen />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('No words in this box yet.')).toBeInTheDocument()
  })
})
