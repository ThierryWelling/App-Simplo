'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/providers/auth-provider'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash, Layout, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Template {
  id: string
  title: string
  slug: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  gradients: string[]
  fonts: {
    heading: string
    body: string
  }
  form_position: string
  form_style: Record<string, any>
  layout_type: string
  created_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user?.id) return

    async function loadTemplates() {
      try {
        setLoading(true)
        const query = supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (filter === 'mine' && user?.id) {
          query.eq('user_id', user.id)
        }

        const { data, error } = await query

        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error('Erro ao carregar templates:', error)
        toast.error('Erro ao carregar templates')
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [user?.id, filter, supabase])

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error

      setTemplates(templates.filter(template => template.id !== id))
      toast.success('Template excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(search.toLowerCase()) ||
    template.description?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Nenhum Template Encontrado</h2>
          <p className="text-zinc-400 mb-6">
            Crie seu primeiro template para começar!
          </p>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Template
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
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-zinc-400">Gerencie seus templates de landing pages</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Criar Template</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-effect rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'mine')}
              className="pl-10 pr-8 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
            >
              <option value="all">Todos os Templates</option>
              <option value="mine">Meus Templates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          Nenhum template encontrado para "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-effect rounded-lg p-6 space-y-4"
            >
              <div className="aspect-video rounded-lg bg-zinc-800/50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-zinc-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">{template.title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{template.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: template.colors.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: template.colors.secondary }}
                  />
                </div>
                <span className="text-xs text-zinc-400 px-2 py-1 rounded-full bg-zinc-800/50">
                  {template.layout_type}
                </span>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Link
                  href={`/dashboard/templates/${template.id}/edit`}
                  className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  Editar
                </Link>
                <Link
                  href={`/dashboard/landing-pages/new?template=${template.id}`}
                  className="flex-1 px-4 py-2 text-sm text-center rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                >
                  Usar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 