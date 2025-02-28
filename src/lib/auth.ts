import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function hasRegisteredUser() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
  
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return count !== null && count > 0
} 