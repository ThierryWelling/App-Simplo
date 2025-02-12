'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/providers/auth-provider'
import { toast } from 'sonner'
import { FileUpload } from '@/components/ui/file-upload'
import { ColorPicker } from '@/components/ui/color-picker'
import { FontPicker } from '@/components/ui/font-picker'
import { Save, Plus, Minus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormBuilder } from '@/components/ui/form-builder'
import { CodeEditor } from '@/components/ui/code-editor'

interface FormData {
  title: string
  description: string
  logo: string
  background: string
  formType: 'custom' | 'builder'
  customHtml: string
  formFields: any[]
  formPosition: 'left' | 'right' | 'center'
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  font: string
  analytics: {
    googleAnalyticsId: string
    metaPixelId: string
  }
  template_id?: string
  formStyle: {
    borderRadius: string
    backgroundColor: string
    inputStyle: string
    buttonStyle: string
  }
}

const defaultFormData: FormData = {
  title: '',
  description: '',
  logo: '',
  background: '',
  formType: 'builder',
  customHtml: '',
  formFields: [],
  formPosition: 'right',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#1e1e1e',
    text: '#ffffff'
  },
  font: 'Inter',
  analytics: {
    googleAnalyticsId: '',
    metaPixelId: ''
  },
  formStyle: {
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.5)',
    inputStyle: 'modern',
    buttonStyle: 'gradient'
  }
}

function CustomizeForm() {
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error

      setFormData({
        ...formData,
        template_id: template.id,
        colors: template.colors,
        formPosition: template.form_position,
        font: template.fonts.body,
        formFields: template.form_fields || [],
        formType: template.form_style?.customHtml ? 'custom' : 'builder',
        customHtml: template.form_style?.customHtml || '',
        formStyle: {
          borderRadius: template.form_style?.borderRadius || '0.5rem',
          backgroundColor: template.form_style?.backgroundColor || 'rgba(0,0,0,0.5)',
          inputStyle: template.form_style?.inputStyle || 'modern',
          buttonStyle: template.form_style?.buttonStyle || 'gradient'
        }
      })

      if (template.form_fields && Array.isArray(template.form_fields)) {
        setFormData(prev => ({
          ...prev,
          formFields: template.form_fields.map((field: any) => ({
            id: field.id || crypto.randomUUID(),
            type: field.type || 'text',
            label: field.label || 'Campo',
            placeholder: field.placeholder || '',
            required: field.required || false
          }))
        }))
      }

    } catch (error) {
      console.error('Erro ao carregar template:', error)
      toast.error('Erro ao carregar template')
      router.push('/dashboard/landing-pages/new')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('landing-pages')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('landing-pages')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      throw error
    }
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

      const { error } = await supabase
        .from('landing_pages')
        .insert({
          title: formData.title,
          slug,
          description: formData.description,
          logo_url: formData.logo,
          background_url: formData.background,
          form_type: formData.formType,
          custom_html: formData.customHtml,
          form_fields: formData.formFields,
          form_position: formData.formPosition,
          form_style: {
            borderRadius: formData.formStyle.borderRadius,
            backgroundColor: formData.formStyle.backgroundColor,
            inputStyle: formData.formStyle.inputStyle,
            buttonStyle: formData.formStyle.buttonStyle
          },
          colors: formData.colors,
          fonts: {
            heading: formData.font,
            body: formData.font
          },
          analytics: formData.analytics,
          template_id: formData.template_id,
          user_id: user?.id
        })

      if (error) throw error

      toast.success('Landing page criada com sucesso!')
      router.push('/dashboard/landing-pages')
    } catch (error: any) {
      console.error('Erro ao criar landing page:', error)
      toast.error(error.message || 'Erro ao criar landing page')
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-2xl font-bold">Personalizar Landing Page</h1>
          <p className="text-zinc-400">Personalize sua landing page baseada no template selecionado</p>
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
            placeholder="Ex: Black Friday 2024"
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
            placeholder="Descreva sua landing page"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Logo
            </label>
            <FileUpload
              value={formData.logo}
              onChange={(url) => setFormData({ ...formData, logo: url })}
              onUpload={handleUpload}
              accept="image/*"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Imagem de Fundo
            </label>
            <FileUpload
              value={formData.background}
              onChange={(url) => setFormData({ ...formData, background: url })}
              onUpload={handleUpload}
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Configurações do Formulário */}
      <div className="glass-effect rounded-lg overflow-hidden">
        <Tabs defaultValue="builder">
          <TabsList className="w-full p-0 bg-transparent border-b border-zinc-800">
            <TabsTrigger value="builder" className="flex-1 rounded-none">
              Construtor de Formulário
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 rounded-none">
              HTML Personalizado
            </TabsTrigger>
          </TabsList>
          <TabsContent value="builder" className="p-6">
            <div className="space-y-6">
              <FormBuilder
                fields={formData.formFields}
                onChange={(fields) => setFormData({ ...formData, formFields: fields })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Posição do Formulário
                  </label>
                  <select
                    value={formData.formPosition}
                    onChange={(e) => setFormData({ ...formData, formPosition: e.target.value as 'left' | 'right' | 'center' })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="left">Esquerda</option>
                    <option value="right">Direita</option>
                    <option value="center">Centro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estilo dos Inputs
                  </label>
                  <select
                    value={formData.formStyle.inputStyle}
                    onChange={(e) => setFormData({
                      ...formData,
                      formStyle: { ...formData.formStyle, inputStyle: e.target.value }
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
                    value={formData.formStyle.buttonStyle}
                    onChange={(e) => setFormData({
                      ...formData,
                      formStyle: { ...formData.formStyle, buttonStyle: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="gradient">Gradiente</option>
                    <option value="solid">Sólido</option>
                    <option value="outline">Contorno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Cor de Fundo do Formulário
                  </label>
                  <ColorPicker
                    value={formData.formStyle.backgroundColor}
                    onChange={(color) => setFormData({
                      ...formData,
                      formStyle: { ...formData.formStyle, backgroundColor: color }
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="custom" className="p-6">
            <CodeEditor
              value={formData.customHtml}
              onChange={(value) => setFormData({ ...formData, customHtml: value })}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Estilo */}
      <div className="glass-effect rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium">Estilo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Fonte
          </label>
          <FontPicker
            value={formData.font}
            onChange={(font) => setFormData({ ...formData, font })}
          />
        </div>
      </div>

      {/* Analytics */}
      <div className="glass-effect rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium">Analytics</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            ID do Google Analytics
          </label>
          <input
            type="text"
            value={formData.analytics.googleAnalyticsId}
            onChange={(e) => setFormData({
              ...formData,
              analytics: { ...formData.analytics, googleAnalyticsId: e.target.value }
            })}
            className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Ex: G-XXXXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            ID do Meta Pixel
          </label>
          <input
            type="text"
            value={formData.analytics.metaPixelId}
            onChange={(e) => setFormData({
              ...formData,
              analytics: { ...formData.analytics, metaPixelId: e.target.value }
            })}
            className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Ex: XXXXXXXXXX"
          />
        </div>
      </div>
    </div>
  )
}

export default function CustomizeLandingPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CustomizeForm />
    </Suspense>
  )
} 