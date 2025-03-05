'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Link2, Clock, Palette } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

interface LandingPage {
  id: string
  title: string
  logo_url: string | null
  background_url: string | null
  content: {
    colors: {
      background: string
      text: string
    }
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateThankYouPageDialog({ isOpen, onClose, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    message: '',
    redirect_url: '',
    redirect_delay: '',
    colors: {
      background: '#ffffff',
      text: '#000000'
    },
    published: false,
    landing_page_id: '',
    logo_url: null as string | null,
    background_url: null as string | null
  })

  // Buscar landing pages ao carregar o componente
  useEffect(() => {
    async function loadLandingPages() {
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .select('id, title, logo_url, background_url, content')
          .order('title')

        if (error) throw error
        setLandingPages(data || [])
      } catch (error) {
        console.error('Erro ao carregar landing pages:', error)
      }
    }

    loadLandingPages()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('thank_you_pages')
        .insert({
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          message: formData.message,
          redirect_url: formData.redirect_url || null,
          redirect_delay: formData.redirect_delay ? Number(formData.redirect_delay) : null,
          colors: formData.colors,
          published: formData.published,
          landing_page_id: formData.landing_page_id || null,
          logo_url: formData.logo_url,
          background_url: formData.background_url
        })

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: 'Página de agradecimento criada com sucesso.',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message === 'duplicate key value violates unique constraint "thank_you_pages_slug_key"'
          ? 'Já existe uma página com este slug. Por favor, escolha outro.'
          : 'Ocorreu um erro ao criar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLandingPageChange = (landingPageId: string) => {
    const selectedLandingPage = landingPages.find(lp => lp.id === landingPageId)
    if (selectedLandingPage) {
      // Extrair apenas o caminho relativo se for uma URL completa
      const getRelativePath = (url: string | null) => {
        if (!url) return null
        if (!url.startsWith('http')) return url
        
        const publicPath = '/storage/v1/object/public/'
        const index = url.indexOf(publicPath)
        return index >= 0 ? url.substring(index + publicPath.length) : url
      }

      setFormData(prev => ({
        ...prev,
        landing_page_id: landingPageId,
        logo_url: getRelativePath(selectedLandingPage.logo_url),
        background_url: getRelativePath(selectedLandingPage.background_url),
        colors: {
          background: selectedLandingPage.content?.colors?.background || prev.colors.background,
          text: selectedLandingPage.content?.colors?.text || prev.colors.text
        }
      }))
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Nova Página de Agradecimento</DialogTitle>
          <CardDescription>Configure sua nova página de agradecimento</CardDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Redirecionamento
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Configure as informações principais da sua página</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="landing_page">Landing Page de Vendas</Label>
                    <Select
                      value={formData.landing_page_id}
                      onValueChange={handleLandingPageChange}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione uma landing page" />
                      </SelectTrigger>
                      <SelectContent>
                        {landingPages.map(lp => (
                          <SelectItem key={lp.id} value={lp.id}>
                            {lp.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Ao selecionar uma landing page, o logo e as cores serão sincronizados automaticamente
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => handleChange('title', e.target.value)}
                      required
                      className="mt-1.5"
                      placeholder="Ex: Obrigado pela sua compra!"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={e => handleChange('description', e.target.value)}
                      required
                      className="mt-1.5"
                      placeholder="Ex: Uma breve descrição para SEO"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL da Página</Label>
                    <div className="flex items-center mt-1.5">
                      <span className="bg-muted px-3 py-2 rounded-l-md text-muted-foreground text-sm">
                        seusite.com/
                      </span>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={e => handleChange('slug', e.target.value)}
                        required
                        className="rounded-l-none"
                        placeholder="pagina-de-agradecimento"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem Principal</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={e => handleChange('message', e.target.value)}
                      required
                      rows={5}
                      className="mt-1.5"
                      placeholder="Digite a mensagem que aparecerá na página..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="message" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Redirecionamento</CardTitle>
                  <CardDescription>Configure para onde o usuário será redirecionado após ver a página</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="redirect_url">URL de Redirecionamento</Label>
                    <Input
                      id="redirect_url"
                      type="url"
                      value={formData.redirect_url}
                      onChange={e => handleChange('redirect_url', e.target.value)}
                      className="mt-1.5"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="redirect_delay">
                      Tempo de Redirecionamento (segundos)
                    </Label>
                    <Input
                      id="redirect_delay"
                      type="number"
                      value={formData.redirect_delay}
                      onChange={e => handleChange('redirect_delay', e.target.value)}
                      min={1}
                      className="mt-1.5"
                      placeholder="Ex: 5"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>Personalize as cores da sua página</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="background_color">Cor de Fundo</Label>
                    <div className="flex gap-3 mt-1.5">
                      <div className="flex-shrink-0">
                        <Input
                          id="background_color"
                          type="color"
                          value={formData.colors.background}
                          onChange={e => handleChange('colors', {
                            ...formData.colors,
                            background: e.target.value
                          })}
                          className="w-12 h-12 p-1 rounded-lg"
                        />
                      </div>
                      <Input
                        type="text"
                        value={formData.colors.background}
                        onChange={e => handleChange('colors', {
                          ...formData.colors,
                          background: e.target.value
                        })}
                        className="flex-1"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="text_color">Cor do Texto</Label>
                    <div className="flex gap-3 mt-1.5">
                      <div className="flex-shrink-0">
                        <Input
                          id="text_color"
                          type="color"
                          value={formData.colors.text}
                          onChange={e => handleChange('colors', {
                            ...formData.colors,
                            text: e.target.value
                          })}
                          className="w-12 h-12 p-1 rounded-lg"
                        />
                      </div>
                      <Input
                        type="text"
                        value={formData.colors.text}
                        onChange={e => handleChange('colors', {
                          ...formData.colors,
                          text: e.target.value
                        })}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Visualize como sua página ficará</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full min-h-[300px] rounded-lg p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
                    style={{ 
                      backgroundColor: formData.colors.background,
                      color: formData.colors.text,
                    }}
                  >
                    {formData.background_url && (
                      <div className="absolute inset-0 z-0">
                        <Image
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${formData.background_url}`}
                          alt="Background"
                          fill
                          className="object-cover"
                          priority
                          sizes="100vw"
                          quality={90}
                        />
                      </div>
                    )}
                    <div className="relative z-10">
                      {formData.logo_url && (
                        <div className="relative w-32 h-32 mx-auto mb-8">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${formData.logo_url}`}
                            alt="Logo"
                            fill
                            className="object-contain"
                            priority
                            sizes="(max-width: 128px) 100vw, 128px"
                            quality={90}
                          />
                        </div>
                      )}
                      <h1 className="text-3xl font-bold mb-4">{formData.title || 'Título da Página'}</h1>
                      <div 
                        className="text-xl opacity-90"
                        dangerouslySetInnerHTML={{ __html: (formData.message || '').replace(/\n/g, '<br>') }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center gap-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={value => handleChange('published', value)}
              />
              <Label htmlFor="published">Publicar Página</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Página'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
