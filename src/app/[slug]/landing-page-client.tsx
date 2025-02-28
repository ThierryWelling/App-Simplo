'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSupabaseImageUrl } from '@/lib/utils'
import Image from 'next/image'
import { notFound } from 'next/navigation'

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

interface LandingPage {
  id: string
  title: string
  description: string
  slug: string
  content: {
    formType: 'custom' | 'system'
    customHtml?: string
    formFields?: Array<{
      id: string
      type: string
      label: string
      placeholder?: string
      required: boolean
      options?: Array<{
        label: string
        value: string
      }>
    }>
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
  ga_id?: string
  meta_pixel_id?: string
  logo_url?: string
  background_url?: string
  event_date_image_url?: string
  participants_image_url?: string
  published: boolean
}

interface Props {
  slug: string
}

interface FormData {
  [key: string]: string
}

// Função para determinar se uma cor é clara ou escura
function isLightBackground(color: string): boolean {
  // Remove o # se existir
  const hex = color.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calcula a luminosidade
  // Fórmula: (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Retorna true se a cor for clara (luminância > 0.5)
  return luminance > 0.5
}

export function LandingPageClient({ slug }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [thankYouPage, setThankYouPage] = useState<ThankYouPage | null>(null)
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    loadPage()
  }, [slug])

  async function loadPage() {
    try {
      // Primeiro tenta encontrar uma página de agradecimento
      const { data: thankYouPage } = await supabase
        .from('thank_you_pages')
        .select('*')
        .eq('slug', slug)
        .single()

      if (thankYouPage && thankYouPage.published) {
        setThankYouPage(thankYouPage)
        setIsLoading(false)
        return
      }

      // Se não encontrar, tenta encontrar uma landing page normal
      const { data: landingPage, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error

      if (!landingPage || !landingPage.published) {
        notFound()
      }

      setLandingPage(landingPage)

      // Adicionar scripts de rastreamento
      if (landingPage.ga_id) {
        addGoogleAnalytics(landingPage.ga_id)
      }
      if (landingPage.meta_pixel_id) {
        addMetaPixel(landingPage.meta_pixel_id)
      }
    } catch (error) {
      console.error('Erro ao carregar página:', error)
      notFound()
    } finally {
      setIsLoading(false)
    }
  }

  function addGoogleAnalytics(gaId: string) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    const script2 = document.createElement('script')
    script2.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `
    document.head.appendChild(script2)
  }

  function addMetaPixel(pixelId: string) {
    const script = document.createElement('script')
    script.text = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!landingPage) return

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const { error } = await supabase
        .from('leads')
        .insert([
          {
            landing_page_id: landingPage.id,
            ...formData,
            data: formData
          }
        ])

      if (error) throw error

      setSubmitSuccess(true)
      setFormData({})

      // Eventos de conversão
      if (landingPage.ga_id && (window as any).gtag) {
        ;(window as any).gtag('event', 'conversion', {
          send_to: landingPage.ga_id
        })
      }
      if (landingPage.meta_pixel_id && (window as any).fbq) {
        ;(window as any).fbq('track', 'Lead')
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error)
      setSubmitError('Erro ao enviar formulário. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Renderiza página de agradecimento
  if (thankYouPage) {
    return (
      <>
        <div 
          className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8"
          style={{ 
            backgroundColor: thankYouPage.colors.background,
            color: thankYouPage.colors.text
          }}
        >
          {thankYouPage.logo_url && (
            <div className="w-full max-w-[500px] h-[200px] sm:h-[220px] md:h-[240px] relative mb-8">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thank-you-pages/${thankYouPage.logo_url}`}
                alt={thankYouPage.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold">{thankYouPage.title}</h1>
            <div 
              className="text-xl sm:text-2xl opacity-90"
              dangerouslySetInnerHTML={{ __html: thankYouPage.message.replace(/\n/g, '<br>') }}
            />
          </div>
        </div>

        {thankYouPage.redirect_url && thankYouPage.redirect_delay && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                setTimeout(() => {
                  window.location.href = "${thankYouPage.redirect_url}";
                }, ${thankYouPage.redirect_delay * 1000});
              `
            }}
          />
        )}
      </>
    )
  }

  // Se não encontrou página de agradecimento, renderiza landing page normal
  if (!landingPage) {
    return notFound()
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundColor: landingPage.content.colors.background,
        color: landingPage.content.colors.text,
        fontFamily: landingPage.content.fonts.body
      }}
    >
      {/* Background que cobre toda a página */}
      {landingPage.background_url && (
        <div className="fixed inset-0 z-0">
          <Image
            src={getSupabaseImageUrl(landingPage.background_url)}
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Conteúdo Principal */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Logo Simplo no topo */}
          <div className="flex justify-center mb-8">
            <Image
              src={getSupabaseImageUrl(
                isLightBackground(landingPage.content.colors.background)
                  ? 'Logo Empresa Simplo/logo simplo azul.png'
                  : 'Logo Empresa Simplo/logo simplo branca.png',
                'landing-pages'
              )}
              alt="Logo Simplo"
              width={200}
              height={60}
              className="object-contain"
              priority
            />
          </div>

          {/* Título e Descrição Centralizados */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="text-center">
              <h1 
                className="text-3xl md:text-4xl font-bold mb-3"
                style={{
                  fontFamily: landingPage.content.fonts.title,
                  color: landingPage.content.colors.primary
                }}
              >
                {landingPage.title}
              </h1>
              <p className="text-base md:text-lg">
                {landingPage.description}
              </p>
            </div>
          </div>

          {/* Espaçamento adicional */}
          <div className="h-[100px]"></div>

          {/* Conteúdo Principal em Grid */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center justify-items-center">
              {/* Lado Esquerdo - Palestrantes */}
              <div className="w-full flex justify-center">
                {landingPage.participants_image_url && (
                  <div className="relative w-full max-w-[600px] h-[300px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden">
                    <Image
                      src={getSupabaseImageUrl(landingPage.participants_image_url)}
                      alt="Participantes"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                )}
              </div>

              {/* Centro - Logo e Data */}
              <div className="flex flex-col gap-4 items-center justify-center w-full">
                {landingPage.logo_url && (
                  <div className="w-full flex justify-center">
                    <div className="relative w-full max-w-[500px] h-[200px] sm:h-[220px] md:h-[240px]">
                      <Image
                        src={getSupabaseImageUrl(landingPage.logo_url)}
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                )}
                
                {/* Data do Evento */}
                {landingPage.event_date_image_url && (
                  <div className="relative w-full max-w-[400px] h-[100px] sm:h-[120px] md:h-[140px]">
                    <Image
                      src={getSupabaseImageUrl(landingPage.event_date_image_url)}
                      alt="Data do Evento"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Lado Direito - Formulário */}
              <div className="w-full flex justify-center">
                <div className="w-full max-w-sm">
                  {landingPage.content.formType === 'custom' ? (
                    <div dangerouslySetInnerHTML={{ __html: landingPage.content.customHtml || '' }} />
                  ) : (
                    <form onSubmit={handleSubmit} className="glass p-4 space-y-3 rounded-2xl w-full">
                      {submitSuccess && (
                        <div className="alert-success text-sm p-2">
                          Formulário enviado com sucesso!
                        </div>
                      )}
                      {submitError && (
                        <div className="alert-error text-sm p-2">
                          {submitError}
                        </div>
                      )}

                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {landingPage.content.formFields?.map(field => (
                          <div key={field.id} className="space-y-1">
                            <label className="text-sm font-medium">
                              {field.label}
                              {field.required && <span className="text-error">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                className="input w-full px-3 py-1.5 rounded-xl text-sm"
                                placeholder={field.placeholder}
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={e => setFormData(data => ({ ...data, [field.id]: e.target.value }))}
                                rows={3}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                className="input w-full px-3 py-1.5 rounded-xl text-sm"
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={e => setFormData(data => ({ ...data, [field.id]: e.target.value }))}
                              >
                                <option value="">Selecione...</option>
                                {field.options?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'radio' ? (
                              <div className="space-y-1">
                                {field.options?.map(option => (
                                  <label key={option.value} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={field.id}
                                      value={option.value}
                                      required={field.required}
                                      checked={formData[field.id] === option.value}
                                      onChange={e => setFormData(data => ({ ...data, [field.id]: e.target.value }))}
                                      className="text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <input
                                type={field.type}
                                className="input w-full px-3 py-1.5 rounded-xl text-sm"
                                placeholder={field.placeholder}
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={e => setFormData(data => ({ ...data, [field.id]: e.target.value }))}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl font-medium text-white text-sm transition-all duration-200"
                        style={{
                          background: `linear-gradient(135deg, ${landingPage.content.colors.primary}, ${landingPage.content.colors.secondary})`,
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Enviando...' : 'Enviar'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mt-auto">
          <div className="glass bg-gradient-to-r from-primary/5 to-accent/5 border-t border-white/10">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <a href="/politica-de-privacidade" className="hover:text-primary transition-colors">
                    Política de privacidade
                  </a>
                  <span className="hidden md:block text-white/20">•</span>
                  <span className="text-text-secondary">CNPJ: 18.923.586/0001-21</span>
                </div>
                <div className="text-center text-text-secondary">
                  © {new Date().getFullYear()} Simplo. Todos os direitos reservados
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
} 