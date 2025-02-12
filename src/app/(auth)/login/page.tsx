'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { toast } from 'sonner'
import { Suspense } from 'react'

// Função para adicionar delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const unauthorized = searchParams.get('unauthorized')
  const error = searchParams.get('error')
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Verifica se já existe uma sessão
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_approved')
          .eq('id', session.user.id)
          .single()

        if (userData?.is_approved) {
          router.push('/dashboard')
          return
        }
      }
    }

    checkExistingSession()

    // Mostra mensagem quando o usuário é redirecionado por não estar autenticado
    if (unauthorized) {
      toast.error('Você precisa fazer login para acessar esta página', {
        duration: 5000,
        position: 'top-center'
      })
    }

    // Mostra mensagem quando há erro de sessão
    if (error === 'session_error') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente', {
        duration: 5000,
        position: 'top-center'
      })
    } else if (error === 'session_expired') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente', {
        duration: 5000,
        position: 'top-center'
      })
    }
  }, [unauthorized, error])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha incorretos')
        }
        throw error
      }

      if (data.user) {
        // Verifica se o usuário está aprovado
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_approved')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          if (userError.code === 'PGRST116') {
            throw new Error('Usuário não encontrado')
          }
          throw userError
        }

        if (!userData.is_approved) {
          await supabase.auth.signOut()
          throw new Error('Sua conta ainda não foi aprovada pelo administrador')
        }

        // Força a atualização da sessão e salva localmente
        const { data: { session } } = await supabase.auth.refreshSession()
        if (session) {
          localStorage.setItem('simplo_live_session', JSON.stringify(session))
        }
        
        toast.success('Login realizado com sucesso!')
        router.push(redirectTo)
        router.refresh() // Força atualização da navegação
        return
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      toast.error(error.message || 'Erro ao fazer login', {
        duration: 5000,
        position: 'top-center'
      })
      
      try {
        await supabase.auth.signOut()
        localStorage.removeItem('simplo_live_session')
      } catch (logoutError) {
        console.error('Erro ao fazer logout:', logoutError)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-950 to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            SimploLive
          </h1>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Ou{' '}
            <Link href="/register" className="font-medium text-purple-500 hover:text-purple-400">
              crie uma nova conta
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="glass-effect rounded-lg p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-purple-500 hover:text-purple-400">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
} 