'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { motion } from 'framer-motion'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Users, 
  FileText, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface DashboardStats {
  total_leads: number
  total_landing_pages: number
  conversion_rate: number
  leads_by_day: Array<{
    date: string
    count: number
  }>
  leads_by_page: Array<{
    title: string
    count: number
  }>
  leads_by_source: Array<{
    source: string
    count: number
  }>
  recent_leads: Array<{
    id: string
    name: string
    email: string
    created_at: string
    page_title: string
    source: string
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const supabase = createClientComponentClient()

  // Cache dos dados por 5 minutos
  const CACHE_TIME = 5 * 60 * 1000 // 5 minutos em milissegundos
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    if (user?.id) {
      const now = Date.now()
      // Só recarrega se passou o tempo de cache ou se não tem dados
      if (!stats || now - lastUpdate > CACHE_TIME) {
        loadStats()
      } else {
        setLoading(false)
      }
    }
  }, [user?.id, dateRange])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verifica se o usuário está autenticado
      if (!user?.id) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .rpc('get_dashboard_stats', {
          p_user_id: user.id,
          p_start_date: new Date(dateRange.start).toISOString(),
          p_end_date: new Date(dateRange.end).toISOString()
        })

      if (error) {
        console.error('Erro ao carregar estatísticas:', error)
        throw new Error(error.message)
      }

      // Atualiza os dados e o timestamp do cache
      setStats(data || {
        total_leads: 0,
        total_landing_pages: 0,
        conversion_rate: 0,
        leads_by_day: [],
        leads_by_page: [],
        leads_by_source: [],
        recent_leads: []
      })
      setLastUpdate(Date.now())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar estatísticas'
      setError(message)
      toast.error(`Erro ao carregar estatísticas: ${message}`)
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: '100%', trend: 'up' }
    const change = ((current - previous) / previous) * 100
    return {
      value: `${Math.abs(change).toFixed(1)}%`,
      trend: change >= 0 ? 'up' : 'down'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  // Verifica se não há dados
  const hasNoData = !stats?.total_landing_pages && !stats?.total_leads

  if (hasNoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao SimploLive!</h2>
          <p className="text-zinc-400 mb-6">
            Parece que você ainda não tem nenhuma landing page ou lead.
            <br />
            Comece criando sua primeira landing page!
          </p>
          <Link
            href="/dashboard/landing-pages/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-colors"
          >
            <FileText className="w-5 h-5 mr-2" />
            Criar Landing Page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="glass-effect rounded-2xl p-6">
        <h1 className="text-2xl font-bold">
          Bem-vindo, {user?.name}! 👋
        </h1>
        <p className="text-zinc-400 mt-2">
          Aqui está um resumo da sua atividade nos últimos 30 dias.
        </p>
      </div>

      {/* Date Range */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <span className="text-sm text-zinc-400">Período:</span>
        </div>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="px-3 py-1 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <span className="text-zinc-400">até</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="px-3 py-1 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">Total de Leads</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.total_leads || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <ArrowUpRight className="w-4 h-4 text-green-500" />
            <span className="text-green-500 ml-1">
              {calculateTrend(stats?.total_leads || 0, 0).value}
            </span>
            <span className="text-zinc-400 ml-2">vs. último período</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">Landing Pages Ativas</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.total_landing_pages || 0}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-zinc-400">
              {stats?.leads_by_page?.length || 0} páginas com leads
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-effect rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">Taxa de Conversão</p>
              <h3 className="text-2xl font-bold mt-1">{stats?.conversion_rate || 0}%</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-zinc-400">
              Média de leads por visualização
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Leads Recentes</h2>
        <div className="space-y-4">
          {stats?.recent_leads?.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-zinc-400">Landing Page: {lead.page_title}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-zinc-400">
                  {format(new Date(lead.created_at), "dd 'de' MMMM", { locale: ptBR })}
                </span>
                <p className="text-sm text-zinc-500">
                  {lead.source || 'Direto'}
                </p>
              </div>
            </motion.div>
          ))}

          {(!stats?.recent_leads || stats.recent_leads.length === 0) && (
            <div className="text-center py-8 text-zinc-400">
              Nenhum lead capturado ainda
            </div>
          )}
        </div>
      </div>

      {/* Leads by Day */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Leads por Dia</h2>
        <div className="space-y-4">
          {stats?.leads_by_day.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {format(new Date(day.date), "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <span className="text-sm font-medium">{day.count} leads</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Page */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Leads por Página</h2>
        <div className="space-y-4">
          {stats?.leads_by_page.map((page) => (
            <div key={page.title} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{page.title}</span>
              <span className="text-sm font-medium">{page.count} leads</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Source */}
      <div className="glass-effect rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Leads por Fonte</h2>
        <div className="space-y-4">
          {stats?.leads_by_source.map((source) => (
            <div key={source.source} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{source.source || 'Direto'}</span>
              <span className="text-sm font-medium">{source.count} leads</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 