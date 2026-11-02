import '@testing-library/jest-dom/vitest'

// Node ≥22 defines a global `localStorage` stub that requires
// `--localstorage-file`, and vitest's jsdom environment strips
// `window.localStorage` to avoid the collision — leaving no usable Storage.
// Install a faithful in-memory Storage for tests instead.
class MemoryStorage implements Storage {
  private map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
}

delete (globalThis as unknown as { localStorage?: unknown }).localStorage
Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
})
