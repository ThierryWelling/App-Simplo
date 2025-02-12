import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Configurações otimizadas para o cliente Supabase
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'simplo_live_session',
  },
  global: {
    headers: { 'x-application-name': 'simplo-live' },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  db: {
    schema: 'public',
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions)

// Tipos das tabelas do Supabase
export type Tables = {
  users: {
    Row: {
      id: string
      name: string
      email: string
      role: 'ADMIN' | 'USER'
      is_approved: boolean
      created_at: string
      updated_at: string
    }
    Insert: Omit<Tables['users']['Row'], 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Tables['users']['Insert']>
  }
  templates: {
    Row: {
      id: string
      title: string
      slug: string
      description: string | null
      colors: {
        primary: string
        secondary: string
        background: string
        text: string
      }
      gradients: string[]
      fonts: {
        heading: string
        body: string
      }
      form_position: string
      form_style: {
        borderRadius: string
        backgroundColor: string
        inputStyle: string
        buttonStyle: string
      }
      layout_type: string
      max_width: string
      spacing: {
        py?: string
        px?: string
        gap?: string
      }
      effects: {
        glassmorphism: boolean
        animation: boolean
        parallax: boolean
      }
      seo: {
        title: string
        description: string
        keywords: string
      }
      widgets: Array<{
        id: string
        type: string
        config: any
        content?: string
        position: { x: number, y: number }
        size: { width: number, height: number }
      }>
      user_id: string
      created_at: string
      updated_at: string
    }
    Insert: Omit<Tables['templates']['Row'], 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Tables['templates']['Insert']>
  }
  landing_pages: {
    Row: {
      id: string
      title: string
      slug: string
      description: string | null
      is_active: boolean
      analytics_id: string | null
      meta_pixel_id: string | null
      created_at: string
      updated_at: string
    }
    Insert: Omit<Tables['landing_pages']['Row'], 'id' | 'created_at' | 'updated_at'>
    Update: Partial<Tables['landing_pages']['Insert']>
  }
  leads: {
    Row: {
      id: string
      email: string
      name: string
      phone: string | null
      custom_fields: Record<string, any> | null
      page_id: string
      created_at: string
    }
    Insert: Omit<Tables['leads']['Row'], 'id' | 'created_at'>
    Update: Partial<Tables['leads']['Insert']>
  }
} 