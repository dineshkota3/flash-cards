import { useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { insforge } from '../lib/insforge'
import { PrimaryButton } from '../components/PrimaryButton'
import { Spinner } from '../components/Spinner'

/**
 * Login screen. Sign-in is the primary flow; the sign-up toggle exists only
 * during setup (signup gets disabled on the backend once both owner accounts
 * exist — after that, sign-up attempts fail with a backend error).
 */
export function LoginScreen() {
  const { reloadUser } = useApp()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (awaitingVerification) {
        // Defensive branch: only reachable if the backend enforces email
        // verification despite our config (checked at setup time).
        const { error: verifyError } = await insforge.auth.verifyEmail({ email, otp })
        if (verifyError) throw verifyError
        await reloadUser()
        return
      }
      if (mode === 'signin') {
        const { error: signInError } = await insforge.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        await reloadUser()
      } else {
        const { data, error: signUpError } = await insforge.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        if (data?.requireEmailVerification) {
          setAwaitingVerification(true)
          setNotice('Check your inbox and enter the verification code.')
        } else if (data?.accessToken) {
          await reloadUser()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[26rem] flex-col justify-center px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-nl text-4xl font-bold text-white">
          NL
        </div>
        <h1 className="text-[28px] font-bold">Nederlands Flashcards</h1>
        <p className="mt-1 text-[15px] text-iosgray">
          {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-[17px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-iosblue"
        />
        <input
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-[17px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-iosblue"
        />
        {awaitingVerification && (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full rounded-2xl border-0 bg-white px-4 py-3.5 text-[17px] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-iosblue"
          />
        )}

        {error && (
          <p className="rounded-xl bg-iosred/10 px-4 py-2.5 text-[15px] text-iosred">{error}</p>
        )}
        {notice && (
          <p className="rounded-xl bg-iosblue/10 px-4 py-2.5 text-[15px] text-iosblue">{notice}</p>
        )}

        <PrimaryButton type="submit" disabled={busy || !email || !password}>
          {busy ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner className="h-5 w-5 border-2" /> Please wait…
            </span>
          ) : awaitingVerification ? (
            'Verify & continue'
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </PrimaryButton>
      </form>

      {!awaitingVerification && (
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setNotice(null)
          }}
          className="mt-5 text-center text-[15px] text-iosblue"
        >
          {mode === 'signin' ? 'First time? Create an account' : 'Already have an account? Sign in'}
        </button>
      )}
    </div>
  )
}
