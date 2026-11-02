import type { ReactNode } from 'react'

/**
 * iOS screen shell: phone-width centered column with safe-area padding,
 * large title, and an optional bottom bar.
 */
export function Screen({
  title,
  right,
  children,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[26rem] flex-col">
      <header className="pt-safe flex items-end justify-between px-5 pb-2">
        <h1 className="text-[34px] font-bold leading-tight">{title}</h1>
        {right}
      </header>
      <main className="flex-1 overflow-y-auto px-5 pb-24">{children}</main>
    </div>
  )
}
