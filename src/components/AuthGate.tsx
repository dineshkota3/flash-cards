import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Spinner } from './Spinner'

/**
 * Route guard. Branch on `loading` (never on `user === null` alone): during
 * the cold-load session round-trip the user is legitimately null but may
 * come back, so show a splash rather than flashing the login screen.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useApp()
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
