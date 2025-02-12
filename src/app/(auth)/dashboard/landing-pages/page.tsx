'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Eye, Edit, Trash, ExternalLink, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'

interface LandingPage {
  id: string
  title: string
  slug: string
  description: string
  published: boolean
  views: number
  leads_count: number
  created_at: string
}

export default function LandingPagesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  // Carrega as landing pages quando o usuário estiver disponível
  useEffect(() => {
    if (!user?.id) return

    async function loadLandingPages() {
      try {
        setLoading(true)
        console.log('Carregando landing pages para o usuário:', user?.id)

        const { data, error } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erro ao carregar landing pages:', error)
          toast.error('Erro ao carregar landing pages')
          return
        }

        console.log('Landing pages carregadas:', data)
        setPages(data || [])
      } catch (error) {
        console.error('Erro ao carregar landing pages:', error)
        toast.error('Erro ao carregar landing pages')
      } finally {
        setLoading(false)
      }
    }

    loadLandingPages()

    // Inscreve-se para mudanças na tabela landing_pages
    const channel = supabase
      .channel('landing_pages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_pages',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Mudança detectada:', payload)
          loadLandingPages() // Recarrega os dados quando houver mudanças
        }
      )
      .subscribe()

    // Cleanup da inscrição
    return () => {
      channel.unsubscribe()
    }
  }, [user?.id, supabase])

  // Revalida os dados quando o componente receber foco
  useEffect(() => {
    if (!user?.id) return

    const handleFocus = () => {
      console.log('Janela recebeu foco, recarregando dados...')
      loadLandingPages()
    }

    async function loadLandingPages() {
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPages(data || [])
      } catch (error) {
        console.error('Erro ao recarregar landing pages:', error)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?.id, supabase])

  const filteredPages = pages
    .filter((page) =>
      page.title.toLowerCase().includes(search.toLowerCase()) ||
      page.description?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((page) => {
      if (filter === 'active') return page.published
      if (filter === 'inactive') return !page.published
      return true
    })

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id) // Garante que só deleta páginas do usuário

      if (error) throw error

      setPages(pages.filter((page) => page.id !== id))
      toast.success('Landing page excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir landing page:', error)
      toast.error('Erro ao excluir landing page')
    }
  }

  // Se não houver usuário, mostra mensagem de carregamento
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Nenhuma Landing Page Encontrada</h2>
          <p className="text-zinc-400 mb-6">
            Crie sua primeira landing page para começar a captar leads!
          </p>
          <Link
            href="/dashboard/landing-pages/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Landing Page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-zinc-400">Gerencie suas landing pages</p>
        </div>
        <Link
          href="/dashboard/landing-pages/new"
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Criar Landing Page</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar landing pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
            >
              <option value="all">Todos</option>
              <option value="active">Publicadas</option>
              <option value="inactive">Rascunhos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Landing Pages Grid */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          Nenhuma landing page encontrada para "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="glass-effect rounded-lg p-6 space-y-4"
            >
              <div className="aspect-video rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <Globe className="w-8 h-8 text-zinc-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">{page.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{page.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{page.views}</span>
                    <span className="text-xs text-zinc-400">views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">{page.leads_count}</span>
                    <span className="text-xs text-zinc-400">leads</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  page.published 
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {page.published ? 'Publicada' : 'Rascunho'}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Link
                  href={`/dashboard/landing-pages/${page.id}/edit`}
                  className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  Editar
                </Link>
                <Link
                  href={`/p/${page.slug}`}
                  target="_blank"
                  className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                >
                  Visualizar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 