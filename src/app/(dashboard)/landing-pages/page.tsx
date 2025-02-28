'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Calendar, 
  Filter,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpDown
} from 'lucide-react'
import { CreateLandingPageDialog } from '@/components/landing-pages/create-landing-page-dialog'
import { EditLandingPageDialog } from '@/components/landing-pages/edit-landing-page-dialog'

interface LandingPage {
  id: string
  title: string
  description: string
  slug: string
  content: any
  published: boolean
  created_at: string
  updated_at: string
  logo_url?: string
  background_url?: string
  event_date_image_url?: string
  participants_image_url?: string
  ga_id?: string
  meta_pixel_id?: string
}

export default function LandingPagesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null)

  useEffect(() => {
    loadLandingPages()
  }, [])

  async function loadLandingPages() {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setLandingPages(data || [])
    } catch (error) {
      console.error('Erro ao carregar landing pages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta landing page?')) return

    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLandingPages(pages => pages.filter(page => page.id !== id))
    } catch (error) {
      console.error('Erro ao excluir landing page:', error)
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .update({ published: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setLandingPages((prevPages: LandingPage[]): LandingPage[] =>
        prevPages.map((page: LandingPage): LandingPage => 
          page.id === id ? { ...page, published: !currentStatus } : page
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const filteredPages = landingPages
    .filter(page => 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(page => {
      if (statusFilter === 'all') return true
      return statusFilter === 'active' ? page.published : !page.published
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-background-secondary rounded-lg w-1/4 animate-pulse" />
        <div className="h-12 bg-background-secondary rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-background-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#1A1F2E]">
          Landing Pages
        </h1>
        <CreateLandingPageDialog onCreated={loadLandingPages} />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por título ou slug..."
            className="input pl-10 pr-4 py-2 w-full rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <select
            className="input pl-10 pr-4 py-2 w-full rounded-xl appearance-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>

        <button
          onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-secondary hover:bg-background text-text-secondary hover:text-primary transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span>Data {sortOrder === 'asc' ? 'mais antiga' : 'mais recente'}</span>
          <ArrowUpDown className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Landing Pages */}
      <div className="space-y-4">
        {filteredPages.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Nenhuma landing page encontrada.
          </div>
        ) : (
          filteredPages.map(page => (
            <div key={page.id} className="card p-6 hover:shadow-elevated transition-all duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-[#1A1F2E]">{page.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      page.published 
                        ? 'bg-success-bg text-success' 
                        : 'bg-error-bg text-error'
                    }`}>
                      {page.published ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-[#1A1F2E] opacity-80 mt-1">/{page.slug}</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleToggleStatus(page.id, page.published)}
                    className={`p-2 rounded-lg transition-colors ${
                      page.published
                        ? 'text-success hover:bg-success-bg'
                        : 'text-error hover:bg-error-bg'
                    }`}
                    title={page.published ? 'Desativar' : 'Ativar'}
                  >
                    {page.published ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>

                  <Link
                    href={`/${page.slug}`}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                    title="Visualizar"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>

                  <button
                    onClick={() => setSelectedPage(page)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 text-text-secondary hover:text-error hover:bg-error-bg rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Edição */}
      {selectedPage && (
        <EditLandingPageDialog
          landingPage={selectedPage}
          onClose={() => setSelectedPage(null)}
          onSaved={(updatedPage) => {
            setLandingPages(pages =>
              pages.map(page =>
                page.id === updatedPage.id ? updatedPage : page
              )
            )
            setSelectedPage(null)
          }}
        />
      )}
    </div>
  )
} 