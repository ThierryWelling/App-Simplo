'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Download, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Lead {
  id: string
  email: string
  name: string
  phone: string | null
  form_data: Record<string, any>
  metadata: Record<string, any>
  page_id: string
  created_at: string
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
}

interface LandingPage {
  id: string
  title: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    pageIds: [] as string[],
    startDate: '',
    endDate: '',
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [totalLeads, setTotalLeads] = useState(0)
  const [page, setPage] = useState(1)
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLandingPages()
    loadLeads()
  }, [filters, page])

  const loadLandingPages = async () => {
    try {
      const { data: pages, error } = await supabase
        .from('landing_pages')
        .select('id, title')
        .order('title')

      if (error) throw error
      setPages(pages || [])
    } catch (error) {
      console.error('Erro ao carregar landing pages:', error)
      toast.error('Erro ao carregar landing pages')
    }
  }

  const loadLeads = async () => {
    try {
      setLoading(true)
      const pageSize = 20
      const offset = (page - 1) * pageSize

      const { data, error } = await supabase
        .rpc('search_leads', {
          page_ids: filters.pageIds.length > 0 ? filters.pageIds : null,
          start_date: filters.startDate || null,
          end_date: filters.endDate || null,
          search_query: filters.search || null,
          limit_val: pageSize,
          offset_val: offset
        })

      if (error) throw error

      if (data && data.length > 0) {
        setLeads(data)
        setTotalLeads(data[0].total_count)
      } else {
        setLeads([])
        setTotalLeads(0)
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
      toast.error('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  const toggleLeadExpansion = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }))
  }

  const exportToCSV = async () => {
    try {
      const { data, error } = await supabase
        .rpc('search_leads', {
          page_ids: filters.pageIds.length > 0 ? filters.pageIds : null,
          start_date: filters.startDate || null,
          end_date: filters.endDate || null,
          search_query: filters.search || null,
          limit_val: totalLeads,
          offset_val: 0
        })

      if (error) throw error

      if (!data || data.length === 0) {
        toast.error('Nenhum dado para exportar')
        return
      }

      // Prepara os dados para CSV
      const csvData = data.map((lead: Lead) => {
        const formData = lead.form_data || {}
        const metadata = lead.metadata || {}
        return {
          'Data': format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          'Nome': lead.name,
          'Email': lead.email,
          'Telefone': lead.phone || '',
          'Landing Page': pages.find(p => p.id === lead.page_id)?.title || '',
          'Origem': lead.source || '',
          'UTM Source': lead.utm_source || '',
          'UTM Medium': lead.utm_medium || '',
          'UTM Campaign': lead.utm_campaign || '',
          ...Object.keys(formData).reduce((acc, key) => ({
            ...acc,
            [`Campo - ${key}`]: formData[key]
          }), {})
        }
      })

      // Converte para CSV
      const headers = Object.keys(csvData[0])
      const csvContent = [
        headers.join(','),
        ...csvData.map((row: Record<string, string>) => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `leads_${format(new Date(), 'dd-MM-yyyy')}.csv`
      link.click()
    } catch (error) {
      console.error('Erro ao exportar leads:', error)
      toast.error('Erro ao exportar leads')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-zinc-400">Gerencie os leads capturados nas suas landing pages</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={loading || totalLeads === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="glass-effect rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-zinc-400" />
            <h2 className="font-medium">Filtros</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Landing Pages
              </label>
              <select
                multiple
                value={filters.pageIds}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions)
                  setFilters(prev => ({
                    ...prev,
                    pageIds: options.map(option => option.value)
                  }))
                  setPage(1)
                }}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {pages.map(page => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, startDate: e.target.value }))
                  setPage(1)
                }}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, endDate: e.target.value }))
                  setPage(1)
                }}
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                    setPage(1)
                  }}
                  placeholder="Buscar por nome, email..."
                  className="w-full pl-10 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Leads */}
      <div className="glass-effect rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Landing Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {leads.map(lead => (
                  <>
                    <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pages.find(p => p.id === lead.page_id)?.title || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {lead.source || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleLeadExpansion(lead.id)}
                          className="text-purple-500 hover:text-purple-400 transition-colors"
                        >
                          {expandedLeads[lead.id] ? 'Ocultar' : 'Ver mais'}
                        </button>
                      </td>
                    </tr>
                    {expandedLeads[lead.id] && (
                      <tr className="bg-zinc-800/30">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Dados do Formulário */}
                            <div>
                              <h4 className="font-medium mb-2">Dados do Formulário</h4>
                              <div className="space-y-2">
                                {Object.entries(lead.form_data || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-start">
                                    <span className="text-sm text-zinc-400 min-w-[120px]">{key}:</span>
                                    <span className="text-sm ml-2">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Metadados */}
                            <div>
                              <h4 className="font-medium mb-2">Metadados</h4>
                              <div className="space-y-2">
                                <div className="flex items-start">
                                  <span className="text-sm text-zinc-400 min-w-[120px]">UTM Source:</span>
                                  <span className="text-sm ml-2">{lead.utm_source || '-'}</span>
                                </div>
                                <div className="flex items-start">
                                  <span className="text-sm text-zinc-400 min-w-[120px]">UTM Medium:</span>
                                  <span className="text-sm ml-2">{lead.utm_medium || '-'}</span>
                                </div>
                                <div className="flex items-start">
                                  <span className="text-sm text-zinc-400 min-w-[120px]">UTM Campaign:</span>
                                  <span className="text-sm ml-2">{lead.utm_campaign || '-'}</span>
                                </div>
                                {Object.entries(lead.metadata || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-start">
                                    <span className="text-sm text-zinc-400 min-w-[120px]">{key}:</span>
                                    <span className="text-sm ml-2">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalLeads > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-800/50">
            <div className="text-sm text-zinc-400">
              Mostrando {Math.min(20 * (page - 1) + 1, totalLeads)} - {Math.min(20 * page, totalLeads)} de {totalLeads} leads
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= totalLeads}
                className="px-3 py-1 rounded-lg bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 