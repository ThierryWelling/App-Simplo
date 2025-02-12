import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não requerem autenticação
const publicUrls = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  try {
    // Verifica rapidamente se é uma rota pública
    const isPublicUrl = publicUrls.some(url => request.nextUrl.pathname.startsWith(url))
    
    // Tenta recuperar a sessão
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    // Se houver erro na sessão, tenta recuperar do localStorage
    if (sessionError) {
      // Se não for uma rota pública, redireciona para login
      if (!isPublicUrl) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        redirectUrl.searchParams.set('error', 'session_expired')
        return NextResponse.redirect(redirectUrl)
      }
      return res
    }

    // Se não estiver logado e não for uma rota pública, redireciona para login
    if (!session && !isPublicUrl) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      redirectUrl.searchParams.set('unauthorized', 'true')
      return NextResponse.redirect(redirectUrl)
    }

    // Se estiver logado e tentar acessar rotas públicas ou a home
    if (session && (isPublicUrl || request.nextUrl.pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Adiciona o token no header para uso posterior
    if (session) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-token', session.access_token)
    }

    return res
  } catch (error) {
    console.error('Erro crítico no middleware:', error)
    // Se houver erro e não for uma rota pública, redireciona para login
    if (!publicUrls.some(url => request.nextUrl.pathname.startsWith(url))) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'session_error')
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }
}

// Configuração de quais rotas o middleware deve interceptar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
} 