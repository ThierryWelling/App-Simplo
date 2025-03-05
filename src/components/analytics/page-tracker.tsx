'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface PageTrackerProps {
  landingPageId: string
}

export function PageTracker({ landingPageId }: PageTrackerProps) {
  useEffect(() => {
    // Gerar ID de sessão único
    const sessionId = uuidv4()
    const startTime = Date.now()

    // Registrar visualização de página
    async function trackPageView() {
      try {
        await supabase.from('page_views').insert({
          landing_page_id: landingPageId,
          session_id: sessionId,
          referrer: document.referrer,
          user_agent: navigator.userAgent
        })
      } catch (error) {
        console.error('Erro ao registrar visualização:', error)
      }
    }

    // Registrar duração da visita ao sair da página
    async function trackDuration() {
      const duration = Math.floor((Date.now() - startTime) / 1000) // Duração em segundos
      try {
        await supabase
          .from('page_views')
          .update({ duration_seconds: duration })
          .eq('session_id', sessionId)
      } catch (error) {
        console.error('Erro ao registrar duração:', error)
      }
    }

    // Registrar eventos de interação
    async function trackEvent(eventType: string, eventData = {}) {
      try {
        await supabase.from('analytics_events').insert({
          landing_page_id: landingPageId,
          session_id: sessionId,
          event_type: eventType,
          event_data: eventData
        })
      } catch (error) {
        console.error('Erro ao registrar evento:', error)
      }
    }

    // Registrar visualização inicial
    trackPageView()

    // Registrar duração ao sair da página
    window.addEventListener('beforeunload', trackDuration)

    // Registrar eventos de interação
    const handleScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100
      )
      if (scrollDepth >= 50) {
        trackEvent('scroll_50_percent')
      }
      if (scrollDepth >= 90) {
        trackEvent('scroll_90_percent')
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('beforeunload', trackDuration)
      window.removeEventListener('scroll', handleScroll)
      trackDuration() // Registrar duração ao desmontar componente
    }
  }, [landingPageId])

  return null
} 