import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: { session } } = await supabase.auth.getSession()

  // Se não estiver logado, redireciona para o login
  if (!session) {
    redirect('/login?unauthorized=true')
  }

  // Se estiver logado, redireciona para o dashboard
  redirect('/dashboard')
} 