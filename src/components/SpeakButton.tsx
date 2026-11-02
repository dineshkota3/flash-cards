import { speakDutch } from '../lib/speech'

/** Round volume-icon button that pronounces the Dutch word aloud. */
export function SpeakButton({ text, label = 'Pronounce Dutch word' }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => speakDutch(text)}
      className="pressable flex h-11 w-11 items-center justify-center rounded-full bg-iosgray/15 text-iosblue"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
        <path
          d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"
          className="opacity-80"
        />
        <path
          d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
          className="opacity-80"
        />
      </svg>
    </button>
  )
}
