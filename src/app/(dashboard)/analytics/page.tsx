'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts'
import {
  Download,
  Users,
  UserPlus,
  Clock,
  ArrowUpRight,
  Search
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LandingPageMetrics {
  landing_page_id: string
  landing_page_title: string
  slug: string
  total_visitors: number
  total_leads: number
  conversion_rate: number
  avg_duration_seconds: number
  visitors_from_google: number
  visitors_from_facebook: number
  visitors_from_instagram: number
  visitors_from_other: number
}

interface DailyMetrics {
  date: string
  visitors: number
  leads: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<LandingPageMetrics[]>([])
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30) // dias

  useEffect(() => {
    checkTables()
    loadMetrics()
  }, [selectedPage, dateRange])

  async function checkTables() {
    try {
      console.log('🔍 Verificando tabelas necessárias...')
      
      // Verificar tabela landing_pages
      const { data: landingPagesData, error: landingPagesError } = await supabase
        .from('landing_pages')
        .select('count')
        .limit(1)
      
      if (landingPagesError) {
        console.error('❌ Erro ao verificar tabela landing_pages:', landingPagesError)
      } else {
        console.log('✅ Tabela landing_pages existe')
      }

      // Verificar tabela page_views
      const { data: pageViewsData, error: pageViewsError } = await supabase
        .from('page_views')
        .select('count')
        .limit(1)
      
      if (pageViewsError) {
        console.error('❌ Erro ao verificar tabela page_views:', pageViewsError)
      } else {
        console.log('✅ Tabela page_views existe')
      }

      // Verificar tabela leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('count')
        .limit(1)
      
      if (leadsError) {
        console.error('❌ Erro ao verificar tabela leads:', leadsError)
      } else {
        console.log('✅ Tabela leads existe')
      }

    } catch (error) {
      console.error('❌ Erro ao verificar tabelas:', error)
    }
  }

  async function loadMetrics() {
    setIsLoading(true)
    try {
      console.log('🔄 Iniciando carregamento de métricas...')
      
      // Carregar métricas gerais
      const { data: landingPagesData, error: landingPagesError } = await supabase
        .from('landing_pages')
        .select('id, title, slug')
      
      if (landingPagesError) {
        console.error('❌ Erro ao carregar landing pages:', landingPagesError)
        throw landingPagesError
      }

      console.log('📋 Landing pages encontradas:', landingPagesData)

      if (!landingPagesData || landingPagesData.length === 0) {
        console.log('⚠️ Nenhuma landing page encontrada')
        setMetrics([])
        return
      }

      // Buscar dados para cada landing page
      const metricsPromises = landingPagesData.map(async (page) => {
        const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')
        console.log(`🔍 Buscando métricas para página ${page.title} desde ${startDate}`)
        
        // Buscar visualizações de página
        const { data: viewsData, error: viewsError } = await supabase
          .from('page_views')
          .select('*')
          .eq('landing_page_id', page.id)
          .gte('created_at', startDate)
        
        if (viewsError) {
          console.error(`❌ Erro ao buscar visualizações para ${page.title}:`, viewsError)
          throw viewsError
        }

        // Buscar leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('landing_page_id', page.id)
          .gte('created_at', startDate)

        if (leadsError) {
          console.error(`❌ Erro ao buscar leads para ${page.title}:`, leadsError)
          throw leadsError
        }

        // Calcular métricas
        const totalVisitors = viewsData?.length || 0
        const totalLeads = leadsData?.length || 0
        const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0
        const avgDuration = viewsData?.reduce((acc, view) => acc + (view.duration_seconds || 0), 0) / (totalVisitors || 1)

        // Calcular origem do tráfego
        const fromGoogle = viewsData?.filter(v => v.referrer?.includes('google')).length || 0
        const fromFacebook = viewsData?.filter(v => v.referrer?.includes('facebook')).length || 0
        const fromInstagram = viewsData?.filter(v => v.referrer?.includes('instagram')).length || 0
        const fromOther = totalVisitors - (fromGoogle + fromFacebook + fromInstagram)

        console.log(`📊 Métricas calculadas para ${page.title}:`, {
          totalVisitors,
          totalLeads,
          conversionRate,
          avgDuration
        })

        return {
          landing_page_id: page.id,
          landing_page_title: page.title,
          slug: page.slug,
          total_visitors: totalVisitors,
          total_leads: totalLeads,
          conversion_rate: Number(conversionRate.toFixed(2)),
          avg_duration_seconds: Number(avgDuration.toFixed(2)),
          visitors_from_google: fromGoogle,
          visitors_from_facebook: fromFacebook,
          visitors_from_instagram: fromInstagram,
          visitors_from_other: fromOther
        }
      })

      const metricsData = await Promise.all(metricsPromises)
      console.log('✅ Todas as métricas calculadas:', metricsData)
      setMetrics(metricsData)

      // Carregar métricas diárias para o gráfico
      if (selectedPage) {
        console.log(`🔄 Carregando métricas diárias para página ${selectedPage}`)
        const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')
        
        // Buscar visualizações de página
        const { data: viewsData, error: viewsError } = await supabase
          .from('page_views')
          .select('created_at')
          .eq('landing_page_id', selectedPage)
          .gte('created_at', startDate)
        
        if (viewsError) {
          console.error('❌ Erro ao buscar visualizações diárias:', viewsError)
          throw viewsError
        }
          
        // Buscar leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('created_at')
          .eq('landing_page_id', selectedPage)
          .gte('created_at', startDate)

        if (leadsError) {
          console.error('❌ Erro ao buscar leads diários:', leadsError)
          throw leadsError
        }

        // Agrupar por dia
        const dailyStats: Record<string, DailyMetrics> = {}
        
        // Inicializar todos os dias no período
        for (let i = 0; i < dateRange; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
          dailyStats[date] = { date, visitors: 0, leads: 0 }
        }
        
        // Adicionar visualizações
        viewsData?.forEach(view => {
          const date = format(new Date(view.created_at), 'yyyy-MM-dd')
          if (dailyStats[date]) {
            dailyStats[date].visitors++
          }
        })

        // Adicionar leads
        leadsData?.forEach(lead => {
          const date = format(new Date(lead.created_at), 'yyyy-MM-dd')
          if (dailyStats[date]) {
            dailyStats[date].leads++
          }
        })

        // Converter para array e ordenar por data
        const sortedDailyMetrics = Object.values(dailyStats).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        console.log('📈 Métricas diárias calculadas:', sortedDailyMetrics)
        setDailyMetrics(sortedDailyMetrics)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error)
      setMetrics([])
      setDailyMetrics([])
    } finally {
      setIsLoading(false)
    }
  }

  function exportToCSV() {
    const selectedMetrics = metrics.find(m => m.landing_page_id === selectedPage) || metrics[0]
    if (!selectedMetrics) return

    const data = [
      ['Métrica', 'Valor'],
      ['Landing Page', selectedMetrics.landing_page_title],
      ['Total de Visitantes', selectedMetrics.total_visitors],
      ['Total de Leads', selectedMetrics.total_leads],
      ['Taxa de Conversão', `${selectedMetrics.conversion_rate}%`],
      ['Tempo Médio (segundos)', selectedMetrics.avg_duration_seconds],
      ['Visitantes do Google', selectedMetrics.visitors_from_google],
      ['Visitantes do Facebook', selectedMetrics.visitors_from_facebook],
      ['Visitantes do Instagram', selectedMetrics.visitors_from_instagram],
      ['Outros Visitantes', selectedMetrics.visitors_from_other],
      ['', ''],
      ['Data', 'Visitantes', 'Leads'],
      ...dailyMetrics.map(day => [
        format(new Date(day.date), 'dd/MM/yyyy'),
        day.visitors,
        day.leads
      ])
    ]

    const csvContent = data.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedMetrics = metrics.find(m => m.landing_page_id === selectedPage) || metrics[0]
  const trafficSourceData = selectedMetrics ? [
    { name: 'Google', value: selectedMetrics.visitors_from_google },
    { name: 'Facebook', value: selectedMetrics.visitors_from_facebook },
    { name: 'Instagram', value: selectedMetrics.visitors_from_instagram },
    { name: 'Outros', value: selectedMetrics.visitors_from_other }
  ] : []

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Métricas e relatórios das suas landing pages
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 rounded-lg border"
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          
          <select
            className="px-4 py-2 rounded-lg border"
            value={selectedPage || ''}
            onChange={(e) => setSelectedPage(e.target.value || null)}
          >
            <option value="">Todas as páginas</option>
            {metrics.map(page => (
              <option key={page.landing_page_id} value={page.landing_page_id}>
                {page.landing_page_title}
              </option>
            ))}
          </select>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card animate-pulse h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <h3 className="text-2xl font-bold mt-2">
                {selectedMetrics?.total_visitors || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Visitantes</p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <UserPlus className="w-8 h-8 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <h3 className="text-2xl font-bold mt-2">
                {selectedMetrics?.total_leads || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Leads</p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <ArrowUpRight className="w-8 h-8 text-primary" />
                <span className="text-xs text-muted-foreground">Média</span>
              </div>
              <h3 className="text-2xl font-bold mt-2">
                {selectedMetrics?.conversion_rate || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-primary" />
                <span className="text-xs text-muted-foreground">Média</span>
              </div>
              <h3 className="text-2xl font-bold mt-2">
                {Math.round(selectedMetrics?.avg_duration_seconds || 0)}s
              </h3>
              <p className="text-sm text-muted-foreground">Tempo na Página</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras */}
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Visitantes e Leads</h3>
              <div style={{ width: '100%', height: '400px' }}>
                {dailyMetrics && dailyMetrics.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart
                      data={dailyMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 65
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: ptBR })}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                        formatter={(value) => [value, '']}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="visitors" name="Visitantes" fill="#0066FF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="leads" name="Leads" fill="#00C49F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível para o período selecionado
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de Pizza */}
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Origem do Tráfego</h3>
              <div style={{ width: '100%', height: '400px' }}>
                {trafficSourceData && trafficSourceData.some(item => item.value > 0) ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={trafficSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                        }
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {trafficSourceData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, 'Visitantes']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum dado de origem de tráfego disponível
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 