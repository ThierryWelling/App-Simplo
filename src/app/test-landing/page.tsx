'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestLandingPage() {
  const [landingPages, setLandingPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLandingPages() {
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .select('*')
        
        if (error) throw error
        
        setLandingPages(data || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar páginas')
      } finally {
        setLoading(false)
      }
    }

    loadLandingPages()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Landing Pages</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <p className="mb-4">Total de páginas: {landingPages.length}</p>
          
          <div className="space-y-4">
            {landingPages.map(page => (
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