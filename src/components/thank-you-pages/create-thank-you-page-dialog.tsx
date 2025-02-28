'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FileUploadZone } from '../landing-pages/file-upload-zone'

const createThankYouPageSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  slug: z.string()
    .min(3, 'O slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'O slug deve conter apenas letras minúsculas, números e hífens'),
  message: z.string().min(10, 'A mensagem deve ter no mínimo 10 caracteres'),
  redirectUrl: z.string().url('URL inválida').optional(),
  redirectDelay: z.number().min(0).max(60).optional(),
  colors: z.object({
    background: z.string(),
    text: z.string()
  })
})

type CreateThankYouPageData = z.infer<typeof createThankYouPageSchema>

interface CreateThankYouPageDialogProps {
  onCreated?: () => void
}

export function CreateThankYouPageDialog({ onCreated }: CreateThankYouPageDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CreateThankYouPageData>({
    resolver: zodResolver(createThankYouPageSchema),
    defaultValues: {
      colors: {
        background: '#FFFFFF',
        text: '#1A1F2E'
      },
      redirectDelay: 5
    }
  })

  // Gerar slug automaticamente a partir do título
  const title = watch('title')
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
  }

  const onSubmit = async (data: CreateThankYouPageData) => {
    setIsLoading(true)
    try {
      // Upload do logo se existir
      let logoUrl = null
      if (logo) {
        const { data: logoData, error: logoError } = await supabase.storage
          .from('thank-you-pages')
          .upload(`logos/${Date.now()}-${logo.name}`, logo)
        
        if (logoError) throw logoError
        logoUrl = logoData.path
      }

      // Criar página de agradecimento
      const { error } = await supabase
        .from('thank_you_pages')
        .insert([
          {
            title: data.title,
            description: data.description,
            slug: data.slug,
            logo_url: logoUrl,
            message: data.message,
            redirect_url: data.redirectUrl,
            redirect_delay: data.redirectDelay,
            colors: data.colors,
            published: false
          }
        ])

      if (error) throw error

      setIsOpen(false)
      reset()
      onCreated?.()
    } catch (error) {
      console.error('Erro ao criar página de agradecimento:', error)
      alert('Erro ao criar página de agradecimento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="btn-action px-4 py-2 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
          <Plus className="w-5 h-5" />
          Nova Página de Agradecimento
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-[#1A1F2E]">
              Nova Página de Agradecimento
            </Dialog.Title>
            <Dialog.Close className="text-text-secondary hover:text-text-primary rounded-lg p-2 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-primary">
                Logo
              </h3>
              <FileUploadZone
                label="Logo"
                onFileSelected={setLogo}
                onRemove={() => setLogo(null)}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium text-text-primary">
                Título
              </label>
              <input
                id="title"
                type="text"
                className="input w-full px-4 py-2 rounded-xl"
                placeholder="Página de Agradecimento"
                {...register('title')}
                onChange={(e) => {
                  register('title').onChange(e)
                  setValue('slug', generateSlug(e.target.value))
                }}
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
                placeholder="Descreva sua página de agradecimento"
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
                placeholder="pagina-de-agradecimento"
                {...register('slug')}
                disabled={isLoading}
              />
              {errors.slug && (
                <p className="text-error text-sm">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="message" className="text-sm font-medium text-text-primary">
                Mensagem de Agradecimento
              </label>
              <textarea
                id="message"
                className="input w-full px-4 py-2 rounded-xl min-h-[150px]"
                placeholder="Digite a mensagem que será exibida para o usuário"
                {...register('message')}
                disabled={isLoading}
              />
              {errors.message && (
                <p className="text-error text-sm">{errors.message.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="redirectUrl" className="text-sm font-medium text-text-primary">
                  URL de Redirecionamento (opcional)
                </label>
                <input
                  id="redirectUrl"
                  type="url"
                  className="input w-full px-4 py-2 rounded-xl"
                  placeholder="https://exemplo.com"
                  {...register('redirectUrl')}
                  disabled={isLoading}
                />
                {errors.redirectUrl && (
                  <p className="text-error text-sm">{errors.redirectUrl.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="redirectDelay" className="text-sm font-medium text-text-primary">
                  Tempo de Redirecionamento (em segundos)
                </label>
                <input
                  id="redirectDelay"
                  type="number"
                  min="0"
                  max="60"
                  className="input w-full px-4 py-2 rounded-xl"
                  {...register('redirectDelay', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.redirectDelay && (
                  <p className="text-error text-sm">{errors.redirectDelay.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-text-primary">
                Cores
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      {...register('colors.background')}
                      className="w-8 h-8 rounded overflow-hidden"
                    />
                    <span className="text-sm">Cor de Fundo</span>
                  </div>
                </div>
                <div className="space-y-2">
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

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-secondary px-4 py-2 rounded-xl"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="btn-action px-4 py-2 rounded-xl flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Página'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 