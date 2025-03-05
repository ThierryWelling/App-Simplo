'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Rocket, Zap, LineChart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function HomeClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (isLoading) {
    return null // Não mostra nada durante a verificação inicial
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-[#1A1F2E] mb-6 leading-tight">
            Simplo Landing Pages
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12">
            Plataforma de criação e gerenciamento de landing pages para transmissões ao vivo.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-gradient-primary text-white px-8 py-4 rounded-2xl font-medium shadow-button hover:shadow-button-hover transition-all duration-300 text-lg"
          >
            Acessar Painel
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A1F2E] mb-4">
              Rápido e Fácil
            </h3>
            <p className="text-slate-600">
              Crie landing pages profissionais em minutos, sem necessidade de conhecimentos técnicos.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A1F2E] mb-4">
              Alta Performance
            </h3>
            <p className="text-slate-600">
              Páginas otimizadas para carregamento rápido e melhor experiência do usuário.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-[#1A1F2E] mb-4">
              Analytics Detalhado
            </h3>
            <p className="text-slate-600">
              Acompanhe o desempenho das suas páginas com métricas em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-slate-600 border-t">
        <p>&copy; {new Date().getFullYear()} Simplo Pages. Todos os direitos reservados.</p>
      </footer>
    </main>
  )
} 