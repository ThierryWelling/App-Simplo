'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Tables } from '@/lib/supabase'
import { toast } from 'sonner'

type User = Tables['users']['Row']

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

// Função auxiliar para adicionar delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Função para retry com backoff exponencial
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await delay(Math.pow(2, i) * 1000)
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Função para carregar os dados do usuário com retry
  const loadUserData = async (userId: string) => {
    return retryWithBackoff(async () => {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) {
          if (userError.code === 'PGRST116') {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) throw new Error('Usuário não encontrado')

            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata.name || 'Usuário',
                role: 'USER',
                is_approved: false
              })
              .select()
              .single()

            if (insertError) throw insertError
            setUser(newUser)
            return newUser
          }
          throw userError
        }

        setUser(userData)
        return userData
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
        throw error
      }
    })
  }

  // Função para verificar e carregar a sessão com retry
  const checkSession = async () => {
    return retryWithBackoff(async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError

        if (session?.user) {
          const userData = await loadUserData(session.user.id)
          
          if (!userData.is_approved) {
            await supabase.auth.signOut()
            setUser(null)
            toast.error('Sua conta ainda não foi aprovada pelo administrador')
            router.push('/login')
            return false
          }
          
          return true
        }
        
        return false
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        return false
      }
    })
  }

  useEffect(() => {
    let mounted = true
    let sessionRefreshInterval: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // Tenta recuperar a sessão do localStorage
        const storedSession = localStorage.getItem('simplo_live_session')
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession)
          if (parsedSession?.user) {
            await loadUserData(parsedSession.user.id)
          }
        }

        // Configura a persistência da sessão
        const { data: { session } } = await supabase.auth.getSession()
        
        // Se já tiver uma sessão, carrega os dados do usuário e salva no localStorage
        if (session?.user) {
          await loadUserData(session.user.id)
          localStorage.setItem('simplo_live_session', JSON.stringify(session))
        }
        
        // Verifica se há uma sessão ativa
        const hasSession = await checkSession()
        
        if (mounted) {
          if (!hasSession) {
            const currentPath = window.location.pathname
            if (!currentPath.startsWith('/login') && 
                !currentPath.startsWith('/register')) {
              router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`)
            }
          }
          setLoading(false)

          // Configura refresh automático do token a cada 3 minutos
          sessionRefreshInterval = setInterval(async () => {
            try {
              const { data: { session }, error } = await supabase.auth.refreshSession()
              if (error) {
                console.error('Erro ao atualizar sessão:', error)
                clearInterval(sessionRefreshInterval)
                checkSession() // Tenta recuperar a sessão em caso de erro
              } else if (session) {
                localStorage.setItem('simplo_live_session', JSON.stringify(session))
              }
            } catch (refreshError) {
              console.error('Erro ao atualizar sessão:', refreshError)
            }
          }, 3 * 60 * 1000) // 3 minutos
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Configura o listener para mudanças de autenticação com retry
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (mounted) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            try {
              const userData = await retryWithBackoff(() => loadUserData(session.user.id))
              if (!userData.is_approved) {
                await supabase.auth.signOut()
                setUser(null)
                toast.error('Sua conta ainda não foi aprovada pelo administrador')
                router.push('/login')
                return
              }

              // Redireciona para a página original após login bem-sucedido
              const params = new URLSearchParams(window.location.search)
              const redirectTo = params.get('redirectTo')
              if (redirectTo && redirectTo !== '/login') {
                router.push(redirectTo)
              } else {
                router.push('/dashboard')
              }
            } catch (error) {
              console.error('Erro ao processar autenticação:', error)
              toast.error('Erro ao carregar dados do usuário')
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    })

    // Adiciona listener para recarregar os dados quando a janela receber foco
    const handleFocus = () => {
      if (user?.id) {
        checkSession()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleFocus)
    window.addEventListener('visibilitychange', handleFocus)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleFocus)
      window.removeEventListener('visibilitychange', handleFocus)
      if (sessionRefreshInterval) {
        clearInterval(sessionRefreshInterval)
      }
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 