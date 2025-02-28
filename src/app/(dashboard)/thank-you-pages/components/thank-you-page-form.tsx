'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
}

interface Props {
  initialData: ThankYouPage
}

export function ThankYouPageForm({ initialData }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('thank_you_pages')
        .update({
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          message: formData.message,
          redirect_url: formData.redirect_url,
          redirect_delay: formData.redirect_delay,
          colors: formData.colors,
          published: formData.published
        })
        .eq('id', formData.id)

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Página de agradecimento atualizada com sucesso.',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ThankYouPage, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={e => handleChange('slug', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="message">Mensagem</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={e => handleChange('message', e.target.value)}
            required
            rows={5}
          />
        </div>

        <div>
          <Label htmlFor="redirect_url">URL de Redirecionamento (opcional)</Label>
          <Input
            id="redirect_url"
            type="url"
            value={formData.redirect_url || ''}
            onChange={e => handleChange('redirect_url', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="redirect_delay">
            Tempo de Redirecionamento (segundos)
          </Label>
          <Input
            id="redirect_delay"
            type="number"
            value={formData.redirect_delay || ''}
            onChange={e => handleChange('redirect_delay', Number(e.target.value))}
            min={1}
          />
        </div>

        <div>
          <Label htmlFor="background_color">Cor de Fundo</Label>
          <Input
            id="background_color"
            type="color"
            value={formData.colors.background}
            onChange={e => handleChange('colors', {
              ...formData.colors,
              background: e.target.value
            })}
          />
        </div>

        <div>
          <Label htmlFor="text_color">Cor do Texto</Label>
          <Input
            id="text_color"
            type="color"
            value={formData.colors.text}
            onChange={e => handleChange('colors', {
              ...formData.colors,
              text: e.target.value
            })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={formData.published}
            onCheckedChange={value => handleChange('published', value)}
          />
          <Label htmlFor="published">Publicado</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  )
}
