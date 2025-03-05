'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadFavicon() {
      try {
        const { data: config } = await supabase
          .from('app_config')
          .select('favicon_url')
          .eq('is_active', true)
          .single()

        if (config?.favicon_url) {
          setFaviconUrl(config.favicon_url)
        }
      } catch (error) {
        console.error('Erro ao carregar favicon:', error)
      }
    }

    loadFavicon()
  }, [])

  if (!faviconUrl) return null

  return (
    <>
      <link rel="icon" type="image/x-icon" href={faviconUrl} />
      <link rel="shortcut icon" type="image/x-icon" href={faviconUrl} />
    </>
  )
} 