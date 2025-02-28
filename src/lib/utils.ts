import { supabase } from './supabase'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9.-]/g, '-') // Substitui caracteres especiais por hífen
    .replace(/--+/g, '-') // Remove hífens duplicados
    .toLowerCase() // Converte para minúsculas
}

export function getSupabaseImageUrl(path: string | null | undefined, bucket: string = 'landing-pages'): string {
  if (!path) return ''
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return ''

  // Remover protocolo se existir
  const cleanUrl = supabaseUrl.replace(/^https?:\/\//, '')

  // Sanitizar o caminho do arquivo
  const sanitizedPath = path.split('/').map(part => encodeURIComponent(part)).join('/')

  return `https://${cleanUrl}/storage/v1/object/public/${bucket}/${sanitizedPath}`
}