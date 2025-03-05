import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from "@/components/ui/toaster"
import { BaseLayout } from '@/components/layout/base-layout'
import { DynamicFavicon } from '@/components/app/dynamic-favicon'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Simplo Landing Pages',
  description: 'Plataforma de criação e gerenciamento de landing pages para transmissões ao vivo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <DynamicFavicon />
      </head>
      <body className={inter.className}>
        <Providers>
          <BaseLayout>{children}</BaseLayout>
        </Providers>
        <Toaster />
      </body>
    </html>
  )
} 