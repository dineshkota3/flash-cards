import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginScreen } from '../screens/LoginScreen'
import { useApp } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}))

// LoginScreen renders the insforge client form only when signed out; with a
// session it must leave /login immediately (regression: successful sign-in
// used to leave the user stuck on the login form).
vi.mock('../lib/insforge', () => ({
  insforge: {},
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

describe('LoginScreen', () => {
  it('renders the sign-in form when signed out', () => {
    mockedUseApp.mockReturnValue({
      user: null,
      loading: false,
      reloadUser: vi.fn(),
    } as unknown as AppContextValue)
    renderLogin()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
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
