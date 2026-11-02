/**
 * Keep the app layout inside the VISUAL viewport. When the iOS keyboard opens,
 * Safari shrinks the visual viewport and pans the page up — bottom-anchored
 * inputs end up covered and top content scrolls off screen. Syncing the root
 * element's height to visualViewport.height (and counter-shifting its offset)
 * keeps the prompt visible above the keyboard at all times.
 */
export function installViewportHeightSync(): void {
  const vv = (window as Window & { visualViewport?: VisualViewport }).visualViewport
  if (!vv) return // older browsers: fall back to 100% height styles

  const update = () => {
    const root = document.documentElement
    root.style.setProperty('--app-height', `${Math.round(vv.height)}px`)
    root.style.setProperty('--vv-offset', `${Math.round(vv.offsetTop)}px`)
    // Undo the body scroll iOS applies when it pans for the keyboard.
    if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0)
  }

  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()
}
