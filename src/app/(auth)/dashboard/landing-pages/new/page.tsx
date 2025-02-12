'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

interface Template {
  id: string
  title: string
  description: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  layout_type: string
}

export default function NewLandingPage() {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data: templates, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTemplates(templates)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      toast.error('Erro ao carregar templates')
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    toast.success('Template selecionado com sucesso!')
    router.push(`/dashboard/landing-pages/new/customize?template=${template.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nova Landing Page</h1>
          <p className="text-zinc-400">Selecione um template para começar</p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className="glass-effect rounded-lg p-6 cursor-pointer transition-all hover:scale-105"
          >
            <div className="aspect-video mb-4 rounded-lg bg-zinc-800/50 overflow-hidden">
              {/* Aqui podemos adicionar uma prévia do template */}
            </div>
            
            <h3 className="text-lg font-medium mb-2">{template.title}</h3>
            <p className="text-sm text-zinc-400 mb-4">{template.description}</p>
            
            <div className="flex items-center justify-between">
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
          </div>
        ))}
      </div>
    </div>
  )
} 