import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X, Loader2, Code, Layout, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FileUploadZone } from './file-upload-zone'

const editLandingPageSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  slug: z.string()
    .min(3, 'O slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'O slug deve conter apenas letras minúsculas, números e hífens'),
  formType: z.enum(['custom', 'system']),
  customHtml: z.string().optional(),
  formFields: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    required: z.boolean()
  })).optional(),
  formPosition: z.enum(['left', 'right', 'center']).default('right'),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    text: z.string()
  }),
  fonts: z.object({
    title: z.string(),
    body: z.string()
  }),
  analytics: z.object({
    gaId: z.string().optional(),
    metaPixelId: z.string().optional()
  })
})

type EditLandingPageData = z.infer<typeof editLandingPageSchema>

interface LandingPage {
  id: string
  title: string
  description: string
  slug: string
  content: {
    formType: 'custom' | 'system'
    customHtml?: string
    formFields?: any[]
    formPosition: 'left' | 'right' | 'center'
    colors: {
      primary: string
      secondary: string
      background: string
      text: string
    }
    fonts: {
      title: string
      body: string
    }
  }
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

interface EditLandingPageDialogProps {
  landingPage: LandingPage
  onClose: () => void
  onSaved: (updatedPage: LandingPage) => void
}

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Telefone' },
  { value: 'textarea', label: 'Área de Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'radio', label: 'Múltipla Escolha' },
  { value: 'checkbox', label: 'Caixa de Seleção' }
]

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: Array<{
    label: string
    value: string
  }>
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export function EditLandingPageDialog({ landingPage, onClose, onSaved }: EditLandingPageDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')
  const [logo, setLogo] = useState<File | null>(null)
  const [background, setBackground] = useState<File | null>(null)
  const [eventDateImage, setEventDateImage] = useState<File | null>(null)
  const [participantsImage, setParticipantsImage] = useState<File | null>(null)
  const [formFields, setFormFields] = useState(landingPage.content.formFields || [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<EditLandingPageData>({
    resolver: zodResolver(editLandingPageSchema),
    defaultValues: {
      title: landingPage.title,
      description: landingPage.description,
      slug: landingPage.slug,
      formType: landingPage.content.formType,
      customHtml: landingPage.content.customHtml,
      formPosition: landingPage.content.formPosition,
      colors: landingPage.content.colors,
      fonts: landingPage.content.fonts,
      analytics: {
        gaId: landingPage.ga_id,
        metaPixelId: landingPage.meta_pixel_id
      }
    }
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    console.log('Iniciando atualização da landing page:', data)
    setIsLoading(true)
    try {
      // Upload de imagens
      let logoUrl = landingPage.logo_url
      let backgroundUrl = landingPage.background_url
      let eventDateImageUrl = landingPage.event_date_image_url
      let participantsImageUrl = landingPage.participants_image_url

      if (logo) {
        console.log('Fazendo upload do logo...')
        const { data: logoData, error: logoError } = await supabase.storage
          .from('landing-pages')
          .upload(`logos/${Date.now()}-${logo.name}`, logo)
        
        if (logoError) {
          console.error('Erro no upload do logo:', logoError)
          throw logoError
        }
        logoUrl = logoData.path
        console.log('Logo enviado com sucesso:', logoUrl)
      }

      if (background) {
        console.log('Fazendo upload do background...')
        const { data: bgData, error: bgError } = await supabase.storage
          .from('landing-pages')
          .upload(`backgrounds/${Date.now()}-${background.name}`, background)
        
        if (bgError) {
          console.error('Erro no upload do background:', bgError)
          throw bgError
        }
        backgroundUrl = bgData.path
        console.log('Background enviado com sucesso:', backgroundUrl)
      }

      if (eventDateImage) {
        console.log('Fazendo upload da imagem de data...')
        const { data: eventData, error: eventError } = await supabase.storage
          .from('landing-pages')
          .upload(`event-dates/${Date.now()}-${eventDateImage.name}`, eventDateImage)
        
        if (eventError) {
          console.error('Erro no upload da imagem de data:', eventError)
          throw eventError
        }
        eventDateImageUrl = eventData.path
        console.log('Imagem de data enviada com sucesso:', eventDateImageUrl)
      }

      if (participantsImage) {
        console.log('Fazendo upload da imagem de participantes...')
        const { data: participantsData, error: participantsError } = await supabase.storage
          .from('landing-pages')
          .upload(`apresentadores/${Date.now()}-${participantsImage.name}`, participantsImage)
        
        if (participantsError) {
          console.error('Erro no upload da imagem de participantes:', participantsError)
          throw participantsError
        }
        participantsImageUrl = participantsData.path
        console.log('Imagem de participantes enviada com sucesso:', participantsImageUrl)
      }

      console.log('Atualizando dados da landing page...')
      const updateData = {
        title: data.title,
        description: data.description,
        slug: data.slug,
        logo_url: logoUrl,
        background_url: backgroundUrl,
        event_date_image_url: eventDateImageUrl,
        participants_image_url: participantsImageUrl,
        content: {
          formType: data.formType,
          customHtml: data.customHtml,
          formFields: data.formType === 'system' ? formFields : undefined,
          formPosition: data.formPosition,
          colors: data.colors,
          fonts: data.fonts
        },
        ga_id: data.analytics.gaId,
        meta_pixel_id: data.analytics.metaPixelId,
        updated_at: new Date().toISOString()
      }
      console.log('Dados para atualização:', updateData)

      // Atualizar landing page
      const { data: updatedData, error } = await supabase
        .from('landing_pages')
        .update(updateData)
        .eq('id', landingPage.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar landing page:', error)
        throw error
      }

      console.log('Landing page atualizada com sucesso:', updatedData)

      const updatedPage = {
        ...landingPage,
        ...updateData,
        id: landingPage.id,
        published: landingPage.published,
        created_at: landingPage.created_at
      }

      onClose()
      onSaved(updatedPage)
    } catch (error) {
      console.error('Erro detalhado ao atualizar landing page:', error)
      alert('Erro ao atualizar landing page. Por favor, verifique o console para mais detalhes.')
    } finally {
      setIsLoading(false)
    }
  })

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-elevated p-6"
          onInteractOutside={(e) => {
            if (isLoading) {
              e.preventDefault()
            }
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-[#1A1F2E]">
              Editar Landing Page
            </Dialog.Title>
            <Dialog.Close 
              className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <Tabs.Root value={currentTab} onValueChange={setCurrentTab}>
            <Tabs.List className="flex gap-2 border-b border-border mb-6">
              <Tabs.Trigger
                value="basic"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'basic'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Informações Básicas
              </Tabs.Trigger>
              <Tabs.Trigger
                value="form"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'form'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Formulário
              </Tabs.Trigger>
              <Tabs.Trigger
                value="style"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'style'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Estilo
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tracking"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  currentTab === 'tracking'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Rastreamento
              </Tabs.Trigger>
            </Tabs.List>

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                console.log('Formulário submetido')
                handleFormSubmit(e)
              }}
              className="space-y-6"
            >
              <Tabs.Content value="basic" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-primary">
                    Imagens
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadZone
                      label="Logo"
                      currentImage={landingPage.logo_url}
                      onFileSelected={setLogo}
                      onRemove={() => setLogo(null)}
                    />
                    <FileUploadZone
                      label="Imagem de Fundo"
                      currentImage={landingPage.background_url}
                      onFileSelected={setBackground}
                      onRemove={() => setBackground(null)}
                    />
                    <FileUploadZone
                      label="Imagem da Data do Evento"
                      currentImage={landingPage.event_date_image_url}
                      onFileSelected={setEventDateImage}
                      onRemove={() => setEventDateImage(null)}
                    />
                    <FileUploadZone
                      label="Imagem dos Participantes/Palestrantes"
                      currentImage={landingPage.participants_image_url}
                      onFileSelected={setParticipantsImage}
                      onRemove={() => setParticipantsImage(null)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="title" className="text-sm font-medium text-text-primary">
                    Título
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="input w-full px-4 py-2 rounded-xl"
                    placeholder="Minha Landing Page"
                    {...register('title')}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-error text-sm">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="description" className="text-sm font-medium text-text-primary">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    className="input w-full px-4 py-2 rounded-xl min-h-[100px]"
                    placeholder="Descreva sua landing page"
                    {...register('description')}
                    disabled={isLoading}
                  />
                  {errors.description && (
                    <p className="text-error text-sm">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="slug" className="text-sm font-medium text-text-primary">
                    Slug (URL)
                  </label>
                  <input
                    id="slug"
                    type="text"
                    className="input w-full px-4 py-2 rounded-xl"
                    placeholder="minha-landing-page"
                    {...register('slug')}
                    disabled={isLoading}
                  />
                  {errors.slug && (
                    <p className="text-error text-sm">{errors.slug.message}</p>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="form" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="custom"
                        {...register('formType')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-primary">HTML Personalizado</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="system"
                        {...register('formType')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-primary">Formulário do Sistema</span>
                    </label>
                  </div>

                  {watch('formType') === 'custom' ? (
                    <div className="space-y-1">
                      <label htmlFor="customHtml" className="text-sm font-medium text-text-primary">
                        Código HTML
                      </label>
                      <div className="relative">
                        <textarea
                          id="customHtml"
                          className="input w-full px-4 py-2 rounded-xl min-h-[200px] font-mono"
                          placeholder="<form>...</form>"
                          {...register('customHtml')}
                          disabled={isLoading}
                        />
                        <div className="absolute top-2 right-2">
                          <Code className="w-5 h-5 text-text-secondary" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-primary">
                          Campos do Formulário
                        </label>
                        <div className="space-y-2">
                          {formFields.map((field, index) => (
                            <div key={field.id} className="card p-4 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-primary">Nome do Campo</label>
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => {
                                        const newFields = [...formFields]
                                        newFields[index].label = e.target.value
                                        newFields[index].placeholder = `Digite ${e.target.value.toLowerCase()}`
                                        setFormFields(newFields)
                                      }}
                                      className="input px-3 py-1.5 rounded-lg text-sm w-full"
                                      placeholder="Ex: Nome Completo"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-primary">Tipo do Campo</label>
                                    <select
                                      value={field.type}
                                      onChange={(e) => {
                                        const newFields = [...formFields]
                                        newFields[index].type = e.target.value
                                        if (!['select', 'radio'].includes(e.target.value)) {
                                          newFields[index].options = undefined
                                        }
                                        setFormFields(newFields)
                                      }}
                                      className="input px-3 py-1.5 rounded-lg text-sm w-full"
                                    >
                                      {fieldTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-primary">Placeholder</label>
                                    <input
                                      type="text"
                                      value={field.placeholder}
                                      onChange={(e) => {
                                        const newFields = [...formFields]
                                        newFields[index].placeholder = e.target.value
                                        setFormFields(newFields)
                                      }}
                                      className="input px-3 py-1.5 rounded-lg text-sm w-full"
                                      placeholder="Ex: Digite seu nome completo"
                                    />
                                  </div>

                                  <div className="flex items-center h-full pt-6">
                                    <label className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(e) => {
                                          const newFields = [...formFields]
                                          newFields[index].required = e.target.checked
                                          setFormFields(newFields)
                                        }}
                                        className="text-primary focus:ring-primary rounded"
                                      />
                                      Campo Obrigatório
                                    </label>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFields = [...formFields]
                                        const field = newFields[index]
                                        newFields[index] = newFields[index - 1]
                                        newFields[index - 1] = field
                                        setFormFields(newFields)
                                      }}
                                      className="p-1.5 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                                      title="Mover para cima"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                  )}
                                  {index < formFields.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFields = [...formFields]
                                        const field = newFields[index]
                                        newFields[index] = newFields[index + 1]
                                        newFields[index + 1] = field
                                        setFormFields(newFields)
                                      }}
                                      className="p-1.5 text-text-secondary hover:text-primary hover:bg-background-secondary rounded-lg transition-colors"
                                      title="Mover para baixo"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormFields(fields => fields.filter((_, i) => i !== index))
                                    }}
                                    className="p-1.5 text-text-secondary hover:text-error hover:bg-error-bg rounded-lg transition-colors"
                                    title="Remover campo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Opções para select e radio */}
                              {['select', 'radio'].includes(field.type) && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-text-primary">
                                    Opções
                                  </label>
                                  <div className="space-y-2">
                                    {field.options?.map((option: { label: string; value: string }, optionIndex: number) => (
                                      <div key={optionIndex} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={option.label}
                                          onChange={(e) => {
                                            const newOptions = [...field.options!]
                                            newOptions[optionIndex] = {
                                              ...newOptions[optionIndex],
                                              label: e.target.value
                                            }
                                            setFormFields(fields => fields.map((f, i) =>
                                              i === index ? { ...f, options: newOptions } : f
                                            ))
                                          }}
                                          className="input flex-1 px-4 py-2 rounded-xl"
                                          placeholder="Rótulo da opção"
                                        />
                                        <input
                                          type="text"
                                          value={option.value}
                                          onChange={(e) => {
                                            const newOptions = [...field.options!]
                                            newOptions[optionIndex] = {
                                              ...newOptions[optionIndex],
                                              value: e.target.value
                                            }
                                            setFormFields(fields => fields.map((f, i) =>
                                              i === index ? { ...f, options: newOptions } : f
                                            ))
                                          }}
                                          className="input flex-1 px-4 py-2 rounded-xl"
                                          placeholder="Valor da opção"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newOptions = field.options!.filter((_: any, i: number) => i !== optionIndex)
                                            setFormFields(fields => fields.map((f, i) =>
                                              i === index ? { ...f, options: newOptions } : f
                                            ))
                                          }}
                                          className="p-2 text-text-secondary hover:text-error hover:bg-error-bg rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-5 h-5" />
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormFields(fields => [
                                          ...fields,
                                          {
                                            id: Date.now().toString(),
                                            type: 'text',
                                            label: '',
                                            placeholder: '',
                                            required: false
                                          }
                                        ])
                                      }}
                                      className="text-sm text-primary hover:text-primary-light transition-colors"
                                    >
                                      + Adicionar Opção
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormFields(fields => [
                              ...fields,
                              {
                                id: Date.now().toString(),
                                type: 'text',
                                label: '',
                                placeholder: '',
                                required: false
                              }
                            ])
                          }}
                          className="btn-secondary px-4 py-2 rounded-xl flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Campo
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-text-primary">
                          Posição do Formulário
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="left"
                              {...register('formPosition')}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Esquerda</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="right"
                              {...register('formPosition')}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Direita</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="center"
                              {...register('formPosition')}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Centro</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="style" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-primary">
                        Cores
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            {...register('colors.primary')}
                            className="w-8 h-8 rounded overflow-hidden"
                          />
                          <span className="text-sm">Cor Primária</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            {...register('colors.secondary')}
                            className="w-8 h-8 rounded overflow-hidden"
                          />
                          <span className="text-sm">Cor Secundária</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            {...register('colors.background')}
                            className="w-8 h-8 rounded overflow-hidden"
                          />
                          <span className="text-sm">Cor de Fundo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            {...register('colors.text')}
                            className="w-8 h-8 rounded overflow-hidden"
                          />
                          <span className="text-sm">Cor do Texto</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-text-primary">
                        Fontes
                      </label>
                      <div className="space-y-2">
                        <select
                          {...register('fonts.title')}
                          className="input w-full px-4 py-2 rounded-xl"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                        <select
                          {...register('fonts.body')}
                          className="input w-full px-4 py-2 rounded-xl"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="tracking" className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="gaId" className="text-sm font-medium text-text-primary">
                    ID do Google Analytics
                  </label>
                  <input
                    id="gaId"
                    type="text"
                    className="input w-full px-4 py-2 rounded-xl"
                    placeholder="G-XXXXXXXXXX"
                    {...register('analytics.gaId')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="metaPixelId" className="text-sm font-medium text-text-primary">
                    ID do Meta Pixel
                  </label>
                  <input
                    id="metaPixelId"
                    type="text"
                    className="input w-full px-4 py-2 rounded-xl"
                    placeholder="XXXXXXXXXXXXXXXXXX"
                    {...register('analytics.metaPixelId')}
                    disabled={isLoading}
                  />
                </div>
              </Tabs.Content>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  className="btn-secondary px-4 py-2 rounded-xl"
                  disabled={isLoading}
                  onClick={() => !isLoading && onClose()}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action px-4 py-2 rounded-xl flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 