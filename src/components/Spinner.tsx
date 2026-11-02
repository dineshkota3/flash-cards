export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-4 border-iosgray/30 border-t-iosblue ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
