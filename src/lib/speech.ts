/**
 * Dutch pronunciation via the Web Speech API. iOS Safari ships Dutch voices,
 * so this speaks instantly and works offline. speechSynthesis.speak() must be
 * triggered by a user gesture on iOS — always call from a tap handler.
 */
export function speakDutch(text: string): void {
  if (typeof window === 'undefined') return
  const synth = window.speechSynthesis
  if (!synth) return
  synth.cancel() // stop any currently-playing word first

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'nl-NL'
  utterance.rate = 0.9 // slightly slower reads clearer for learners

  const voices = synth.getVoices()
  const dutchVoice =
    voices.find((v) => v.lang === 'nl-NL') ??
    voices.find((v) => v.lang?.startsWith('nl'))
  if (dutchVoice) utterance.voice = dutchVoice
  // No voice object available: utterance.lang still lets the OS pick one.

  synth.speak(utterance)
}
