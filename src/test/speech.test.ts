import { describe, it, expect, vi, beforeEach } from 'vitest'
import { speakDutch } from '../lib/speech'

interface FakeUtterance {
  text: string
  lang: string
  rate: number
  voice: unknown
}

class MockSpeechSynthesis {
  spoken: FakeUtterance[] = []
  cancelled = 0
  voices: Array<{ lang: string; name: string }> = []

  getVoices() {
    return this.voices
  }

  cancel() {
    this.cancelled += 1
  }

  speak(utterance: FakeUtterance) {
    this.spoken.push(utterance)
  }
}

function installSynth(voices: Array<{ lang: string; name: string }> = []) {
  const synth = new MockSpeechSynthesis()
  synth.voices = voices
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: synth,
  })
  // jsdom has no SpeechSynthesisUtterance — minimal stand-in.
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: class {
      text: string
      lang = ''
      rate = 1
      voice: unknown = null
      constructor(text: string) {
        this.text = text
      }
    },
  })
  return synth
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('speakDutch', () => {
  it('speaks the text with the Dutch language tag', () => {
    const synth = installSynth()
    speakDutch('boom')
    expect(synth.spoken).toHaveLength(1)
    expect(synth.spoken[0].text).toBe('boom')
    expect(synth.spoken[0].lang).toBe('nl-NL')
  })

  it('cancels any currently playing word first', () => {
    const synth = installSynth()
    speakDutch('boom')
    speakDutch('huis')
    expect(synth.cancelled).toBe(2)
    expect(synth.spoken.map((u) => u.text)).toEqual(['boom', 'huis'])
  })

  it('prefers an exact nl-NL voice', () => {
    const synth = installSynth([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'nl-BE', name: 'Ellen' },
      { lang: 'nl-NL', name: 'Xander' },
    ])
    speakDutch('boom')
    expect(synth.spoken[0].voice).toMatchObject({ name: 'Xander' })
  })

  it('falls back to any nl-* voice', () => {
    const synth = installSynth([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'nl-BE', name: 'Ellen' },
    ])
    speakDutch('boom')
    expect(synth.spoken[0].voice).toMatchObject({ name: 'Ellen' })
  })

  it('reads slower than normal for learners', () => {
    const synth = installSynth()
    speakDutch('boom')
    expect(synth.spoken[0].rate).toBeLessThan(1)
    expect(synth.spoken[0].rate).toBeGreaterThan(0.5)
  })

  it('does nothing when speech synthesis is unsupported', () => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined })
    expect(() => speakDutch('boom')).not.toThrow()
  })
})
