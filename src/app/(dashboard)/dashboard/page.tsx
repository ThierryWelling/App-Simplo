'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Users, ArrowRight } from 'lucide-react'
import { CreateLandingPageDialog } from '@/components/landing-pages/create-landing-page-dialog'

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    landingPages: 0,
    thankYouPages: 0,
    leads: 0
  })

  async function loadStats() {
    try {
      const { count: landingPagesCount } = await supabase
        .from('landing_pages')
        .select('*', { count: 'exact', head: true })

      const { count: thankYouPagesCount } = await supabase
        .from('thank_you_pages')
        .select('*', { count: 'exact', head: true })

      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      setStats({
        landingPages: landingPagesCount || 0,
        thankYouPages: thankYouPagesCount || 0,
        leads: leadsCount || 0
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/auth/login'
        return
      }
      
      loadStats()
    }
    
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-background-secondary rounded-lg w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="h-32 bg-background-secondary rounded-xl animate-pulse" />
          <div className="h-32 bg-background-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#1A1F2E]">
          Dashboard
        </h1>
        <CreateLandingPageDialog onCreated={loadStats} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Landing Pages */}
        <div className="card p-6 hover:scale-102 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#1A1F2E] opacity-80 mb-2">Landing Pages</p>
              <h2 className="text-4xl font-bold text-[#1A1F2E]">
                {stats.landingPages}
              </h2>
            </div>
            <div className="bg-primary/10 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
          <Link 
            href="/landing-pages"
            className="flex items-center gap-2 text-primary hover:text-primary-light mt-6 text-sm font-medium"
          >
            Ver todas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card de Páginas de Agradecimento */}
        <div className="card p-6 hover:scale-102 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#1A1F2E] opacity-80 mb-2">Páginas de Agradecimento</p>
              <h2 className="text-4xl font-bold text-[#1A1F2E]">
                {stats.thankYouPages}
              </h2>
            </div>
            <div className="bg-accent/10 p-3 rounded-xl">
              <FileText className="w-6 h-6 text-accent" />
            </div>
          </div>
          <Link 
            href="/thank-you-pages"
            className="flex items-center gap-2 text-accent hover:opacity-80 mt-6 text-sm font-medium"
          >
            Ver todas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Card de Leads */}
        <div className="card p-6 hover:scale-102 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#1A1F2E] opacity-80 mb-2">Leads Capturados</p>
              <h2 className="text-4xl font-bold text-[#1A1F2E]">
                {stats.leads}
              </h2>
            </div>
            <div className="bg-accent/10 p-3 rounded-xl">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <Link 
            href="/leads"
            className="flex items-center gap-2 text-accent hover:opacity-80 mt-6 text-sm font-medium"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
} 