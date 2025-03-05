'use client'

import { AnimatedBackground } from '@/components/ui/animated-background'

interface BaseLayoutProps {
  children: React.ReactNode
  withAnimation?: boolean
}

export function BaseLayout({ children, withAnimation = true }: BaseLayoutProps) {
  return (
    <>
      {withAnimation && <AnimatedBackground />}
      {children}
    </>
  )
} 