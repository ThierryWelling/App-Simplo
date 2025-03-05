'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, Calendar, ArrowUpDown, CheckCircle2, XCircle, Eye, Pencil, Trash2, Plus } from 'lucide-react'
import { CreateThankYouPageDialog } from './components/create-thank-you-page-dialog'
import { EditThankYouPageDialog } from './components/edit-thank-you-page-dialog'
import { Button } from '@/components/ui/button'

interface ThankYouPage {
  id: string
  title: string
  description: string
  slug: string
  logo_url: string | null
  message: string
  redirect_url: string | null
  redirect_delay: number | null
  colors: {
    background: string
    text: string
  }
  published: boolean
  created_at: string
  landing_page_id: string | null
  background_url: string | null
}

export default function ThankYouPagesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [thankYouPages, setThankYouPages] = useState<ThankYouPage[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingPage, setEditingPage] = useState<ThankYouPage | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadThankYouPages()
  }, [])

  async function loadThankYouPages() {
    try {
      const { data, error } = await supabase
        .from('thank_you_pages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Garante que cada página tenha as cores padrão
      const formattedData = (data || []).map(page => ({
        ...page,
        colors: {
          background: page.colors?.background || '#ffffff',
          text: page.colors?.text || '#000000'
        }
      }))

      setThankYouPages(formattedData)
    } catch (error) {
      console.error('Erro ao carregar páginas de agradecimento:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta página de agradecimento?')) return

    try {
      const { error } = await supabase
        .from('thank_you_pages')
        .delete()
        .eq('id', id)

      if (error) throw error

      setThankYouPages(pages => pages.filter(page => page.id !== id))
    } catch (error) {
      console.error('Erro ao excluir página de agradecimento:', error)
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('thank_you_pages')
        .update({ published: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setThankYouPages(prevPages => 
        prevPages.map(page => 
          page.id === id ? { ...page, published: !currentStatus } : page
        )
      )
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const filteredPages = thankYouPages
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Páginas de Agradecimento</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Página
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
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

      <div className="space-y-4">
        {filteredPages.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Nenhuma página de agradecimento encontrada.
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

                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-5 h-5" />
                  </a>

                  <button
                    onClick={() => setEditingPage(page)}
                    className="p-2 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-5 h-5" />
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
      <CreateThankYouPageDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={loadThankYouPages}
      />

      {editingPage && (
        <EditThankYouPageDialog
          page={editingPage}
          isOpen={!!editingPage}
          onClose={() => setEditingPage(null)}
          onUpdate={loadThankYouPages}
        />
      )}
    </div>
  )
}