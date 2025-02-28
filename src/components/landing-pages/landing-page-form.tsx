import { supabase } from '@/lib/supabase'
import { sanitizeFileName } from '@/lib/utils'

async function handleFileUpload(file: File, bucket: string, prefix: string = '') {
  try {
    const timestamp = Date.now()
    const sanitizedFileName = sanitizeFileName(file.name)
    const filePath = `${prefix}/${timestamp}-${sanitizedFileName}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    return filePath
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error)
    throw error
  }
} 