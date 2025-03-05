'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSpecificPage() {
  const specificSlug = 'inscricao-realizada-live'
  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSpecificPage() {
      try {
        // Primeiro tenta encontrar uma página de agradecimento
        const { data: thankYouPage, error: thankYouError } = await supabase
          .from('thank_you_pages')
          .select('*')
          .eq('slug', specificSlug)
          .single()

        if (!thankYouError && thankYouPage) {
          setPageData({
            type: 'thank_you_page',
            data: thankYouPage
          })
          setLoading(false)
          return
        }

        // Se não encontrar, tenta encontrar uma landing page normal
        const { data: landingPage, error: landingError } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', specificSlug)
          .single()

        if (!landingError && landingPage) {
          setPageData({
            type: 'landing_page',
            data: landingPage
          })
          setLoading(false)
          return
        }

        setError(`Nenhuma página encontrada com o slug: ${specificSlug}`)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar página')
      } finally {
        setLoading(false)
      }
    }

    loadSpecificPage()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste Específico: {specificSlug}</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : pageData ? (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Página Encontrada!</h2>
          <p><strong>Tipo:</strong> {pageData.type}</p>
          <p><strong>Título:</strong> {pageData.data.title}</p>
          <p><strong>Slug:</strong> {pageData.data.slug}</p>
          <p><strong>Publicada:</strong> {pageData.data.published ? 'Sim' : 'Não'}</p>
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Dados Completos:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(pageData.data, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <p>Nenhuma página encontrada.</p>
      )}
    </div>
  )
} 