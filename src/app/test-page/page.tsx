'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [thankYouPages, setThankYouPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadThankYouPages() {
      try {
        const { data, error } = await supabase
          .from('thank_you_pages')
          .select('*')
        
        if (error) throw error
        
        setThankYouPages(data || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar páginas')
      } finally {
        setLoading(false)
      }
    }

    loadThankYouPages()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Páginas de Agradecimento</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <p className="mb-4">Total de páginas: {thankYouPages.length}</p>
          
          <div className="space-y-4">
            {thankYouPages.map(page => (
              <div key={page.id} className="border p-4 rounded">
                <h2 className="text-xl font-bold">{page.title}</h2>
                <p><strong>Slug:</strong> {page.slug}</p>
                <p><strong>Publicada:</strong> {page.published ? 'Sim' : 'Não'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 