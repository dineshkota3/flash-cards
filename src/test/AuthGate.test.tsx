import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthGate } from '../components/AuthGate'
import { useApp } from '../context/AppContext'
import type { AppContextValue } from '../context/AppContext'

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(),
}))

const mockedUseApp = vi.mocked(useApp)

describe('AuthGate', () => {
  it('shows a loading splash (never the login flash) while the session rehydrates', () => {
    mockedUseApp.mockReturnValue({ loading: true, user: null } as AppContextValue)
    render(
      <MemoryRouter>
        <AuthGate>
          <div>protected content</div>
        </AuthGate>
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders protected children when a user is present', () => {
    mockedUseApp.mockReturnValue({
      loading: false,
      user: { id: 'u1', email: 'me@example.com' },
    } as unknown as AppContextValue)
    render(
      <MemoryRouter>
        <AuthGate>
          <div>protected content</div>
        </AuthGate>
      </MemoryRouter>,
    )
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('redirects to /login when loading finished without a user', () => {
    mockedUseApp.mockReturnValue({ loading: false, user: null } as AppContextValue)
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AuthGate>
                <div>protected content</div>
              </AuthGate>
            }
          />
          <Route path="/login" element={<div>login screen</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('login screen')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })
})
