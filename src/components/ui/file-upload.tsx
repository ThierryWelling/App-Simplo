'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface FileUploadProps {
  value?: string
  onChange: (value: string) => void
  onUpload: (file: File) => Promise<string>
  accept?: string
  maxSize?: number
}

export function FileUpload({
  value,
  onChange,
  onUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
}: FileUploadProps) {
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Verifica se há arquivos rejeitados
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      if (error.code === 'file-too-large') {
        toast.error(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`)
      } else if (error.code === 'file-invalid-type') {
        toast.error('Tipo de arquivo não suportado')
      } else {
        toast.error('Erro ao processar arquivo')
      }
      return
    }

    try {
      setLoading(true)
      const file = acceptedFiles[0]

      // Validação adicional de tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione uma imagem válida')
      }

      // Validação de dimensões para imagens
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = () => reject(new Error('Erro ao carregar imagem'))
        img.src = URL.createObjectURL(file)
      })

      // Verifica dimensões mínimas
      if (dimensions.width < 100 || dimensions.height < 100) {
        throw new Error('A imagem deve ter no mínimo 100x100 pixels')
      }

      const url = await onUpload(file)
      onChange(url)
      toast.success('Imagem enviada com sucesso!')
    } catch (error: any) {
      console.error('Erro no upload:', error)
      toast.error(error.message || 'Erro ao enviar imagem')
      // Limpa o valor em caso de erro
      onChange('')
    } finally {
      setLoading(false)
    }
  }, [onUpload, onChange, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      [accept]: []
    },
    maxSize,
    multiple: false,
    onError: (error) => {
      console.error('Erro no Dropzone:', error)
      toast.error('Erro ao processar arquivo')
    }
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-zinc-700 hover:border-purple-500/50'
        }`}
      >
        <input {...getInputProps()} />
        {value ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-zinc-900/20" />
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              onError={() => {
                toast.error('Erro ao carregar preview da imagem')
                onChange('')
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="absolute top-2 right-2 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Upload className={`w-8 h-8 ${loading ? 'animate-bounce' : ''}`} />
            <div className="text-sm text-center">
              {loading ? (
                <span>Enviando imagem...</span>
              ) : isDragActive ? (
                <span>Solte a imagem aqui</span>
              ) : (
                <span>
                  Arraste e solte uma imagem aqui, ou clique para selecionar
                  <p className="text-xs text-zinc-500 mt-1">
                    Tamanho máximo: {Math.round(maxSize / 1024 / 1024)}MB
                  </p>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 