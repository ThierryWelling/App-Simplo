import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
      landing_pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: any
          meta_description: string
          meta_title: string
          ga_id?: string
          meta_pixel_id?: string
          created_at: string
          updated_at: string
          published: boolean
          thumbnail_url?: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: any
          meta_description?: string
          meta_title?: string
          ga_id?: string
          meta_pixel_id?: string
          created_at?: string
          updated_at?: string
          published?: boolean
          thumbnail_url?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: any
          meta_description?: string
          meta_title?: string
          ga_id?: string
          meta_pixel_id?: string
          created_at?: string
          updated_at?: string
          published?: boolean
          thumbnail_url?: string
        }
      }
      leads: {
        Row: {
          id: string
          landing_page_id: string
          name?: string
          email: string
          phone?: string
          data: any
          created_at: string
        }
        Insert: {
          id?: string
          landing_page_id: string
          name?: string
          email: string
          phone?: string
          data?: any
          created_at?: string
        }
        Update: {
          id?: string
          landing_page_id?: string
          name?: string
          email?: string
          phone?: string
          data?: any
          created_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          landing_page_id: string
          session_id: string
          referrer?: string
          user_agent?: string
          duration_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landing_page_id: string
          session_id: string
          referrer?: string
          user_agent?: string
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landing_page_id?: string
          session_id?: string
          referrer?: string
          user_agent?: string
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          landing_page_id: string
          session_id: string
          event_type: string
          event_data: any
          created_at: string
        }
        Insert: {
          id?: string
          landing_page_id: string
          session_id: string
          event_type: string
          event_data?: any
          created_at?: string
        }
        Update: {
          id?: string
          landing_page_id?: string
          session_id?: string
          event_type?: string
          event_data?: any
          created_at?: string
        }
      }
    }
  }
} 