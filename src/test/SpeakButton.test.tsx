import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakButton } from '../components/SpeakButton'

const speakDutch = vi.fn()
vi.mock('../lib/speech', () => ({ speakDutch: (t: string) => speakDutch(t) }))

describe('SpeakButton', () => {
  it('renders an accessible volume button', () => {
    render(<SpeakButton text="boom" />)
    expect(screen.getByRole('button', { name: 'Pronounce Dutch word' })).toBeInTheDocument()
  })

  it('speaks the given Dutch word on tap', async () => {
    const user = userEvent.setup()
    render(<SpeakButton text="de boom" />)
    await user.click(screen.getByRole('button'))
    expect(speakDutch).toHaveBeenCalledWith('de boom')
  })
})
