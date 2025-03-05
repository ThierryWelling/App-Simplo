'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getSupabaseImageUrl } from '@/lib/utils'
import Image from 'next/image'
// Importação para carregar fontes dinamicamente
import { Roboto, Inter, Montserrat, Poppins, Open_Sans, Lato } from 'next/font/google'
import { PageTracker } from '@/components/analytics/page-tracker'

// Definição de fontes individuais no escopo do módulo
const interFont = Inter({ subsets: ['latin'], display: 'swap' })
const robotoFont = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' })
const montserratFont = Montserrat({ subsets: ['latin'], display: 'swap' })
const poppinsFont = Poppins({ weight: ['400', '500', '700'], subsets: ['latin'], display: 'swap' })
const openSansFont = Open_Sans({ subsets: ['latin'], display: 'swap' })
const latoFont = Lato({ weight: ['400', '700'], subsets: ['latin'], display: 'swap' })

// Função para obter classe CSS da fonte
function getFontClass(fontName: string | undefined): string {
  if (!fontName) return '';
  
  // Mapeia o nome da fonte para a classe correspondente
  switch (fontName) {
    case 'Inter': return interFont.className;
    case 'Roboto': return robotoFont.className;
    case 'Montserrat': return montserratFont.className;
    case 'Poppins': return poppinsFont.className;
    case 'Open Sans': return openSansFont.className;
    case 'Lato': return latoFont.className;
    default: return '';
  }
}

interface ThankYouPage {
  id: string
  title: string
  description: string
  slug: string
  logo_url: string | null
  background_url: string | null
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

function isLightBackground(color: string): boolean {
  // Remove o # se existir
  color = color.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  
  // Calcula a luminosidade
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5
}

// Otimização de imagens com preload
const preloadImage = (url: string) => {
  if (typeof window === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
};

// Cache de URLs processadas
const urlCache = new Map<string, string>();
function processImageUrl(url: string | null | undefined, bucket: string = 'landing-pages'): string {
  if (!url) return '';
  
  const cacheKey = `${url}-${bucket}`;
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!;
  }

  try {
    url = url.trim();
    if (url.startsWith('http')) {
      urlCache.set(cacheKey, url);
      return url;
    }
    
    if (url.startsWith('/')) {
      url = url.substring(1);
    }
    
    const processedUrl = getSupabaseImageUrl(url, bucket);
    urlCache.set(cacheKey, processedUrl);
    return processedUrl;
    } catch (error) {
    console.error('❌ Erro ao processar URL:', error);
    return '';
  }
}

// Função para adicionar scripts de Google Analytics de forma mais segura
  function addGoogleAnalytics(gaId: string) {
  try {
    // Verificar se o script já existe para evitar duplicação
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
      console.log('🔍 Script Google Analytics já existe, não adicionando novamente');
      return;
    }
    
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
    console.log('✅ Google Analytics adicionado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao adicionar Google Analytics:', error);
  }
  }

// Função para adicionar Meta Pixel de forma mais segura
  function addMetaPixel(pixelId: string) {
  try {
    // Verificar se o script já existe para evitar duplicação
    if (document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')) {
      console.log('🔍 Script Meta Pixel já existe, não adicionando novamente');
      return;
    }
    
    const script = document.createElement('script')
    script.text = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      if(s && s.parentNode){s.parentNode.insertBefore(t,s)}else{b.head.appendChild(t)}}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)
    console.log('✅ Meta Pixel adicionado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao adicionar Meta Pixel:', error);
  }
}

// Adicionar função utilitária para checar se estamos no navegador
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Componente RedirectCounter otimizado
function RedirectCounter({ delay, redirectUrl }: { delay: number; redirectUrl: string }) {
  const [timeLeft, setTimeLeft] = useState(delay);
  const redirectTimeRef = useRef(Date.now() + delay * 1000);

  useEffect(() => {
    if (!redirectUrl || delay <= 0) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((redirectTimeRef.current - Date.now()) / 1000);
      
      if (remaining <= 0) {
        clearInterval(interval);
        window.location.href = redirectUrl;
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-base sm:text-lg md:text-xl font-medium bg-white/10 rounded-lg p-3 sm:p-4">
      Redirecionando em {timeLeft} segundos...
    </div>
  );
}

export function LandingPageClient({ slug }: Props) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thankYouPage, setThankYouPage] = useState<ThankYouPage | null>(null);
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pageNotFound, setPageNotFound] = useState(false);

  // Carregamento otimizado da página
  useEffect(() => {
    async function loadPage() {
      try {
        const cleanSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '');
        
        // Primeiro tenta carregar a página de agradecimento
        const { data: thankYouData, error: thankYouError } = await supabase
          .from('thank_you_pages')
          .select('*')
          .eq('slug', cleanSlug)
          .eq('published', true)
          .single();

        if (thankYouData) {
          const page: ThankYouPage = {
            ...thankYouData,
            title: thankYouData.title || 'Obrigado!',
            message: thankYouData.message || '',
            redirect_delay: Number(thankYouData.redirect_delay) || null,
            colors: {
              background: thankYouData.colors?.background || '#ffffff',
              text: thankYouData.colors?.text || '#000000'
            }
          };

          setThankYouPage(page);

          // Preload de imagens críticas
          if (page.logo_url) preloadImage(processImageUrl(page.logo_url));
          if (page.background_url) preloadImage(processImageUrl(page.background_url));
          
          setIsLoading(false);
          return;
        }

        // Se não encontrou página de agradecimento, tenta carregar landing page
        const { data: landingData, error: landingError } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', cleanSlug)
          .eq('published', true)
          .single();

        if (landingData) {
          setLandingPage(landingData as LandingPage);

          // Preload de imagens críticas
          if (landingData.logo_url) preloadImage(processImageUrl(landingData.logo_url));
          if (landingData.background_url) preloadImage(processImageUrl(landingData.background_url));
          if (landingData.event_date_image_url) preloadImage(processImageUrl(landingData.event_date_image_url));
          
          setIsLoading(false);
          return;
        }

        setPageNotFound(true);
      } catch (error) {
        console.error('❌ Erro ao carregar página:', error);
        setPageNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (mounted) {
      loadPage();
    }
  }, [mounted, slug]);

  // Montagem do componente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Adicionar scripts de rastreamento após a página ser carregada
  useEffect(() => {
    if (landingPage && isBrowser()) {
      if (landingPage.ga_id) {
        addGoogleAnalytics(landingPage.ga_id);
      }
      if (landingPage.meta_pixel_id) {
        addMetaPixel(landingPage.meta_pixel_id);
      }
    }
  }, [landingPage]);

  // Early return para SSR
  if (!mounted) return null;

  // Loading state otimizado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Página de agradecimento
  if (thankYouPage) {
    return (
        <div 
        className="min-h-screen w-full relative flex flex-col"
          style={{ 
          color: thankYouPage.colors?.text || '#000000'
        }}
      >
        {/* Background como primeira coisa */}
        {thankYouPage.background_url && (
          <div 
            className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: `url(${processImageUrl(thankYouPage.background_url)})`,
            }}
          />
        )}

        {/* Conteúdo principal */}
        <div className="relative z-10 flex-1 flex items-center justify-center min-h-screen py-4 sm:py-8 px-3 sm:px-4">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Logo */}
          {thankYouPage.logo_url && (
                <div className="mb-6 sm:mb-8">
                  <img
                    src={processImageUrl(thankYouPage.logo_url)}
                    alt="Logo"
                    className="w-full max-w-[240px] sm:max-w-[300px] md:max-w-[400px] h-[120px] sm:h-[160px] md:h-[200px] mx-auto object-contain"
              />
            </div>
          )}

              {/* Título e Mensagem */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">{thankYouPage.title}</h1>
                {thankYouPage.message && (
                  <div 
                    className="text-base sm:text-lg md:text-xl"
              dangerouslySetInnerHTML={{ __html: thankYouPage.message.replace(/\n/g, '<br>') }}
            />
                )}
              </div>

              {/* Contador e Botões */}
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                {typeof thankYouPage.redirect_delay === 'number' && 
                 thankYouPage.redirect_delay > 0 && 
                 thankYouPage.redirect_url && (
                  <>
                    <RedirectCounter 
                      delay={thankYouPage.redirect_delay} 
                      redirectUrl={thankYouPage.redirect_url} 
                    />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-stretch sm:items-center mt-3 sm:mt-4">
                      <a
                        href={thankYouPage.redirect_url}
                        className="bg-green-500 hover:bg-green-600 text-white font-medium px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-4 h-4 sm:w-5 sm:h-5">
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                        </svg>
                        <span>Entrar no Grupo Agora</span>
                      </a>
                      <button
                        onClick={() => window.location.href = thankYouPage.redirect_url!}
                        className="bg-white/80 hover:bg-white text-black font-medium px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors text-xs sm:text-sm w-full sm:w-auto"
                      >
                        Não quero esperar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Página não encontrada
  if (pageNotFound || (!thankYouPage && !landingPage)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Página não encontrada</h1>
          <p className="text-gray-600 mb-8">
            Esta página não existe ou não está disponível no momento.
          </p>
          <a 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para a página inicial
          </a>
        </div>
      </div>
    );
  }

  // Landing page
  if (landingPage) {
    const titleFontClass = getFontClass(landingPage.content.fonts.title);
    const bodyFontClass = getFontClass(landingPage.content.fonts.body);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!landingPage) return;

      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess(false);

      try {
        // Criar objeto do lead com todos os dados necessários
        const leadData = {
          landing_page_id: landingPage.id,
          form_data: formData,
          created_at: new Date().toISOString(),
          status: 'new',
          metadata: {
            user_agent: window.navigator.userAgent,
            referrer: document.referrer,
            url: window.location.href
          }
        };

        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        console.log('✅ Lead salvo com sucesso:', leadData);
        setSubmitSuccess(true);
        setFormData({});

        // Eventos de conversão
        if (landingPage.ga_id && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            send_to: landingPage.ga_id,
            event_category: 'lead',
            event_label: landingPage.title
          });
        }
        if (landingPage.meta_pixel_id && (window as any).fbq) {
          (window as any).fbq('track', 'Lead', {
            landing_page: landingPage.title,
            form_data: formData
          });
        }

        // Buscar a página de agradecimento
        const { data: thankYouPageData, error: thankYouError } = await supabase
          .from('thank_you_pages')
          .select('*')
          .eq('landing_page_id', landingPage.id)
          .eq('published', true)
          .single();

        if (thankYouError) {
          console.error("❌ Erro ao buscar página de agradecimento:", thankYouError);
          return;
        }

        if (thankYouPageData?.slug) {
          setTimeout(() => {
            window.location.href = `/${thankYouPageData.slug}`;
          }, 500);
        }
      } catch (error) {
        console.error('❌ Erro ao enviar formulário:', error);
        setSubmitError('Ocorreu um erro ao enviar o formulário. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div
        className={`min-h-screen flex flex-col relative ${bodyFontClass}`}
      style={{
          color: landingPage.content.colors.text
      }}
    >
        {/* Background como primeira coisa */}
      {landingPage.background_url && (
          <div 
            className="fixed inset-0 w-full h-full bg-no-repeat bg-cover bg-center"
            style={{
              backgroundImage: `url(${processImageUrl(landingPage.background_url)})`,
            }}
          />
        )}

        {/* Componente de rastreamento */}
        <PageTracker landingPageId={landingPage.id} />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Conteúdo Principal */}
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Logo Simplo no topo */}
          <div className="flex justify-center mb-4 sm:mb-8">
            <Image
                src={processImageUrl(
                isLightBackground(landingPage.content.colors.background)
                  ? 'Logo Empresa Simplo/logo simplo azul.png'
                  : 'Logo Empresa Simplo/logo simplo branca.png',
                'landing-pages'
              )}
              alt="Logo Simplo"
              width={150}
              height={45}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain w-[150px] sm:w-[200px]"
              priority
            />
          </div>

          {/* Título e Descrição Centralizados */}
            <div className="text-center px-4">
              <div className="max-w-3xl mx-auto mb-4 sm:mb-6">
                <div className="text-center p-4 sm:p-6 rounded-xl">
              <h1 
                    className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 ${titleFontClass}`}
                style={{
                  color: landingPage.content.colors.primary
                }}
              >
                {landingPage.title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg">
                {landingPage.description}
              </p>
                </div>
            </div>
          </div>

          {/* Espaçamento reduzido em mobile */}
            <div className="h-[30px] sm:h-[50px]"></div>

          {/* Conteúdo Principal em Grid */}
            <div className="max-w-5xl mx-auto px-2 sm:px-4 md:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-center">
              {/* Lado Esquerdo - Palestrantes */}
              <div className="hidden lg:flex w-full justify-center">
                {landingPage.participants_image_url && (
                    <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
                    <Image
                        src={processImageUrl(landingPage.participants_image_url)}
                      alt="Participantes"
                      fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                )}
              </div>

              {/* Centro - Logo e Data */}
              <div className="flex flex-col gap-3 sm:gap-4 items-center justify-center w-full col-span-1 lg:col-span-1">
                {landingPage.logo_url && (
                  <div className="w-full flex justify-center">
                      <div className="relative w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[240px] rounded-xl">
                      <Image
                          src={processImageUrl(landingPage.logo_url)}
                        alt="Logo"
                        fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                )}
                
                {/* Data do Evento */}
                {landingPage.event_date_image_url && (
                    <div className="relative w-full h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] rounded-xl">
                    <Image
                        src={processImageUrl(landingPage.event_date_image_url)}
                      alt="Data do Evento"
                      fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Lado Direito - Formulário */}
              <div className="w-full flex justify-center">
                  <div className="w-full max-w-[350px] sm:max-w-[400px]">
                  {landingPage.content.formType === 'custom' ? (
                    <div dangerouslySetInnerHTML={{ __html: landingPage.content.customHtml || '' }} />
                  ) : (
                      <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 rounded-xl w-full bg-white/80">
                      {submitSuccess && (
                          <div className="alert-success text-xs sm:text-sm p-2 rounded">
                          Formulário enviado com sucesso!
                        </div>
                      )}
                      {submitError && (
                          <div className="alert-error text-xs sm:text-sm p-2 rounded">
                          {submitError}
                        </div>
                      )}

                        <div className="space-y-3 sm:space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-2">
                        {landingPage.content.formFields?.map(field => (
                            <div key={field.id} className="space-y-1 sm:space-y-2">
                              <label className="text-xs sm:text-sm font-medium block">
                              {field.label}
                                {field.required && <span className="text-error ml-1">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                              <textarea
                                  className="input w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm"
                                placeholder={field.placeholder}
                                required={field.required}
                                value={formData[field.id] || ''}
                                onChange={e => setFormData(data => ({ ...data, [field.id]: e.target.value }))}
                                rows={3}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                  className="input w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm"
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
                            ) : (
                              <input
                                type={field.type}
                                  className="input w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm"
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
                          className="w-full py-2 sm:py-3 rounded-xl font-medium text-white text-xs sm:text-sm md:text-base transition-all duration-200"
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
            <div className="border-t border-white/10 bg-white/80">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
              <div className="flex flex-col md:flex-row justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-4">
                    <a href="/politica-de-privacidade" className="hover:text-primary transition-colors text-black">
                    Política de privacidade
                  </a>
                    <span className="hidden md:block text-black">•</span>
                    <span className="text-black">CNPJ: 18.923.586/0001-21</span>
                </div>
                  <div className="text-center text-black">
                  © {new Date().getFullYear()} Simplo. Todos os direitos reservados
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
    );
  }

  return null;
} 