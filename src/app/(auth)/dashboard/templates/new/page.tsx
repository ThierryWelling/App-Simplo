'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { ColorPicker } from '@/components/ui/color-picker'
import { FontPicker } from '@/components/ui/font-picker'
import { Save, Plus, Minus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditorCanvas } from '@/components/ui/editor/editor-canvas'

interface FormData {
  title: string
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
  form_style: {
    borderRadius: string
    backgroundColor: string
    inputStyle: string
    buttonStyle: string
  }
  layout_type: string
  max_width: string
  spacing: {
    py?: string
    px?: string
    gap?: string
  }
  effects: {
    glassmorphism: boolean
    animation: boolean
    parallax: boolean
  }
  seo: {
    title: string
    description: string
    keywords: string
  }
  widgets: Array<{
    id: string
    type: string
    config: any
    content?: string
    position: { x: number, y: number }
    size: { width: number, height: number }
  }>
}

const defaultFormData: FormData = {
  title: '',
  description: '',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#1e1e1e',
    text: '#ffffff'
  },
  gradients: [],
  fonts: {
    heading: 'Inter',
    body: 'Inter'
  },
  form_position: 'right',
  form_style: {
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.5)',
    inputStyle: 'modern',
    buttonStyle: 'gradient'
  },
  layout_type: 'default',
  max_width: 'full',
  spacing: {},
  effects: {
    glassmorphism: false,
    animation: false,
    parallax: false
  },
  seo: {
    title: '',
    description: '',
    keywords: ''
  },
  widgets: []
}

const layoutTypes = [
  { id: 'default', name: 'Padrão', description: 'Layout tradicional com formulário ao lado' },
  { id: 'centered', name: 'Centralizado', description: 'Conteúdo centralizado com formulário abaixo' },
  { id: 'minimal', name: 'Minimalista', description: 'Design limpo e minimalista' },
  { id: 'hero', name: 'Hero', description: 'Grande imagem de fundo com formulário sobreposto' }
]

export default function NewTemplatePage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'visual' | 'config'>('visual')
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const addGradient = () => {
    setFormData({
      ...formData,
      gradients: [...formData.gradients, 'linear-gradient(45deg, #3b82f6, #8b5cf6)']
    })
  }

  const updateGradient = (index: number, value: string) => {
    const newGradients = [...formData.gradients]
    newGradients[index] = value
    setFormData({ ...formData, gradients: newGradients })
  }

  const removeGradient = (index: number) => {
    setFormData({
      ...formData,
      gradients: formData.gradients.filter((_, i) => i !== index)
    })
  }

  const handleWidgetsChange = (widgets: FormData['widgets']) => {
    setFormData(prev => ({ ...prev, widgets }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (!formData.title || !formData.description) {
        toast.error('Título e descrição são obrigatórios')
        return
      }

      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { data: template, error } = await supabase
        .from('templates')
        .insert({
          title: formData.title,
          slug,
          description: formData.description,
          colors: formData.colors,
          gradients: formData.gradients,
          fonts: formData.fonts,
          form_position: formData.form_position,
          form_style: formData.form_style,
          layout_type: formData.layout_type,
          max_width: formData.max_width,
          spacing: formData.spacing,
          effects: formData.effects,
          seo: formData.seo,
          widgets: formData.widgets,
          user_id: user?.id
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Template salvo com sucesso!')
      router.push('/dashboard/templates')
    } catch (error: any) {
      console.error('Erro ao salvar template:', error)
      toast.error(error.message || 'Erro ao salvar template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Novo Template</h1>
          <p className="text-zinc-400">Crie um novo template para suas landing pages</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'Salvando...' : 'Salvar'}</span>
        </button>
      </div>

      {/* Informações Básicas */}
      <div className="glass-effect rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium">Informações Básicas</h2>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Título
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Ex: Landing Page Moderna"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Descreva seu template"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Tipo de Layout
          </label>
          <select
            value={formData.layout_type}
            onChange={(e) => setFormData({ ...formData, layout_type: e.target.value })}
            className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="default">Padrão</option>
            <option value="split">Dividido</option>
            <option value="centered">Centralizado</option>
            <option value="minimal">Minimalista</option>
            <option value="hero">Hero</option>
          </select>
        </div>
      </div>

      {/* Preview e Edição */}
      <div className="glass-effect rounded-lg overflow-hidden">
        <Tabs defaultValue="visual">
          <TabsList className="w-full p-0 bg-transparent border-b border-zinc-800">
            <TabsTrigger value="visual" className="flex-1 rounded-none">
              Editor Visual
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-1 rounded-none">
              Configuração Manual
            </TabsTrigger>
          </TabsList>
          <TabsContent value="visual" className="p-0">
            <div className="h-[600px]">
              <EditorCanvas 
                value={formData.widgets}
                onChange={handleWidgetsChange}
              />
            </div>
          </TabsContent>
          <TabsContent value="config" className="p-6">
            <div className="space-y-8">
              {/* Cores */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Cores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Cor Primária
                    </label>
                    <ColorPicker
                      value={formData.colors.primary}
                      onChange={(color) => setFormData({
                        ...formData,
                        colors: { ...formData.colors, primary: color }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Cor Secundária
                    </label>
                    <ColorPicker
                      value={formData.colors.secondary}
                      onChange={(color) => setFormData({
                        ...formData,
                        colors: { ...formData.colors, secondary: color }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Cor de Fundo
                    </label>
                    <ColorPicker
                      value={formData.colors.background}
                      onChange={(color) => setFormData({
                        ...formData,
                        colors: { ...formData.colors, background: color }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Cor do Texto
                    </label>
                    <ColorPicker
                      value={formData.colors.text}
                      onChange={(color) => setFormData({
                        ...formData,
                        colors: { ...formData.colors, text: color }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Gradientes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h3 className="text-lg font-medium">Gradientes</h3>
                  <button
                    onClick={addGradient}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.gradients.map((gradient, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={gradient}
                        onChange={(e) => updateGradient(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="linear-gradient(45deg, #3b82f6, #8b5cf6)"
                      />
                      <button
                        onClick={() => removeGradient(index)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fontes */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Fontes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Fonte dos Títulos
                    </label>
                    <FontPicker
                      value={formData.fonts.heading}
                      onChange={(font) => setFormData({
                        ...formData,
                        fonts: { ...formData.fonts, heading: font }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Fonte do Corpo
                    </label>
                    <FontPicker
                      value={formData.fonts.body}
                      onChange={(font) => setFormData({
                        ...formData,
                        fonts: { ...formData.fonts, body: font }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Formulário</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Posição do Formulário
                    </label>
                    <select
                      value={formData.form_position}
                      onChange={(e) => setFormData({ ...formData, form_position: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                      <option value="center">Centro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Estilo dos Campos
                    </label>
                    <select
                      value={formData.form_style.inputStyle}
                      onChange={(e) => setFormData({
                        ...formData,
                        form_style: { ...formData.form_style, inputStyle: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="modern">Moderno</option>
                      <option value="classic">Clássico</option>
                      <option value="minimal">Minimalista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Estilo do Botão
                    </label>
                    <select
                      value={formData.form_style.buttonStyle}
                      onChange={(e) => setFormData({
                        ...formData,
                        form_style: { ...formData.form_style, buttonStyle: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="solid">Sólido</option>
                      <option value="outline">Contorno</option>
                      <option value="gradient">Gradiente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Raio da Borda
                    </label>
                    <input
                      type="text"
                      value={formData.form_style.borderRadius}
                      onChange={(e) => setFormData({
                        ...formData,
                        form_style: { ...formData.form_style, borderRadius: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="0.5rem"
                    />
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Layout</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tipo de Layout
                    </label>
                    <select
                      value={formData.layout_type}
                      onChange={(e) => setFormData({ ...formData, layout_type: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {layoutTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - {type.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Largura Máxima
                    </label>
                    <select
                      value={formData.max_width}
                      onChange={(e) => setFormData({ ...formData, max_width: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="full">Largura Total</option>
                      <option value="7xl">Extra Grande (1280px)</option>
                      <option value="6xl">Muito Grande (1080px)</option>
                      <option value="5xl">Grande (1024px)</option>
                      <option value="4xl">Médio (896px)</option>
                      <option value="3xl">Pequeno (768px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Espaçamento */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Espaçamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Padding Vertical
                    </label>
                    <select
                      value={formData.spacing?.py}
                      onChange={(e) => setFormData({
                        ...formData,
                        spacing: { ...formData.spacing, py: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="4">Pequeno (1rem)</option>
                      <option value="8">Médio (2rem)</option>
                      <option value="12">Grande (3rem)</option>
                      <option value="16">Extra Grande (4rem)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Padding Horizontal
                    </label>
                    <select
                      value={formData.spacing?.px}
                      onChange={(e) => setFormData({
                        ...formData,
                        spacing: { ...formData.spacing, px: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="4">Pequeno (1rem)</option>
                      <option value="8">Médio (2rem)</option>
                      <option value="12">Grande (3rem)</option>
                      <option value="16">Extra Grande (4rem)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Gap entre Elementos
                    </label>
                    <select
                      value={formData.spacing?.gap}
                      onChange={(e) => setFormData({
                        ...formData,
                        spacing: { ...formData.spacing, gap: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="4">Pequeno (1rem)</option>
                      <option value="8">Médio (2rem)</option>
                      <option value="12">Grande (3rem)</option>
                      <option value="16">Extra Grande (4rem)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Efeitos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">Efeitos</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.effects?.glassmorphism}
                        onChange={(e) => setFormData({
                          ...formData,
                          effects: { ...formData.effects, glassmorphism: e.target.checked }
                        })}
                        className="rounded border-zinc-700/50"
                      />
                      <span className="text-sm font-medium text-zinc-300">Efeito Vidro</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.effects?.animation}
                        onChange={(e) => setFormData({
                          ...formData,
                          effects: { ...formData.effects, animation: e.target.checked }
                        })}
                        className="rounded border-zinc-700/50"
                      />
                      <span className="text-sm font-medium text-zinc-300">Animações</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.effects?.parallax}
                        onChange={(e) => setFormData({
                          ...formData,
                          effects: { ...formData.effects, parallax: e.target.checked }
                        })}
                        className="rounded border-zinc-700/50"
                      />
                      <span className="text-sm font-medium text-zinc-300">Efeito Parallax</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-zinc-800 pb-2">SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Meta Título
                    </label>
                    <input
                      type="text"
                      value={formData.seo?.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Título para SEO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Meta Descrição
                    </label>
                    <textarea
                      value={formData.seo?.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, description: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Descrição para SEO"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Palavras-chave
                    </label>
                    <input
                      type="text"
                      value={formData.seo?.keywords}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo: { ...formData.seo, keywords: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Palavras-chave separadas por vírgula"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 