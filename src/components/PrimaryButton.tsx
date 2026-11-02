import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blue' | 'green' | 'red' | 'gray'
}

const styles = {
  blue: 'bg-iosblue text-white',
  green: 'bg-iosgreen text-white',
  red: 'bg-iosred text-white',
  gray: 'bg-iosgray/15 text-iosblue',
} as const

export function PrimaryButton({ variant = 'blue', className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`pressable w-full rounded-2xl py-3.5 text-[17px] font-semibold ${styles[variant]} disabled:opacity-50 ${className}`}
    />
  )
}
