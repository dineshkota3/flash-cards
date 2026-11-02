import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginScreen } from '../screens/LoginScreen'
import { useApp } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}))

// Chainable query-builder mock for insforge.database.from('app_config')
const dbState = vi.hoisted(() => ({ signupValue: null as string | null }))
vi.mock('../lib/insforge', () => ({
  insforge: {
    database: {
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: () => Promise.resolve({ data: dbState.signupValue === null ? null : { value: dbState.signupValue } }),
        }
        return chain
      },
    },
  },
}))

const mockedUseApp = vi.mocked(useApp)

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  dbState.signupValue = 'false'
  mockedUseApp.mockReturnValue({
    user: null,
    loading: false,
    reloadUser: vi.fn(),
  } as unknown as AppContextValue)
})

describe('LoginScreen', () => {
  it('renders the sign-in form when signed out', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('hides the sign-up option when signup is disabled', async () => {
    renderLogin()
    await screen.findByText('Sign in')
    expect(screen.queryByText('First time? Create an account')).not.toBeInTheDocument()
  })

  it('shows the sign-up option only when signup is enabled', async () => {
    dbState.signupValue = 'true'
    renderLogin()
    expect(await screen.findByText('First time? Create an account')).toBeInTheDocument()
  })

  it('redirects to home as soon as a session exists', () => {
    mockedUseApp.mockReturnValue({
      user: { id: 'u1', email: 'me@example.com' },
      loading: false,
      reloadUser: vi.fn(),
    } as unknown as AppContextValue)
    renderLogin()
    expect(screen.getByText('home screen')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
  })
})
