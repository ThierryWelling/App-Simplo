'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/dashboard/sidebar'
import { BaseLayout } from '@/components/layout/base-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/auth/login'
    }
  }

  return (
    <BaseLayout withAnimation={false}>
      {/* Sidebar */}
      <Sidebar onCollapse={setIsMenuCollapsed} />

      {/* Conteúdo Principal */}
      <main 
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          isMenuCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Loading Backdrop - Será controlado por estado global */}
      <div className="loading-backdrop hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="loading-spinner w-8 h-8" />
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </div>
    </BaseLayout>
  )
} 