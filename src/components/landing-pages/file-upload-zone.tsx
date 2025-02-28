'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { getSupabaseImageUrl, sanitizeFileName } from '@/lib/utils'

interface FileUploadZoneProps {
  label: string
  currentImage?: string | null
  onFileSelected: (file: File) => void
  onRemove: () => void
}

export function FileUploadZone({ 
  label, 
  currentImage,
  onFileSelected,
  onRemove 
}: FileUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const sanitizedName = sanitizeFileName(file.name)
    const newFile = new File([file], sanitizedName, { type: file.type })

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setImageError(false)
    onFileSelected(newFile)
  }, [onFileSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setImageError(false)
    onRemove()
  }

  const imageUrl = preview || (!imageError && getSupabaseImageUrl(currentImage))

  const handleImageError = () => {
    setImageError(true)
  }

  const renderContent = () => {
    if (imageUrl && !imageError) {
      return (
        <div className="relative aspect-video rounded-xl overflow-hidden">
          <Image
            src={imageUrl}
            alt={label}
            fill
            className="object-cover"
            onError={handleImageError}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-error rounded-lg text-white hover:bg-error/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <div
        {...getRootProps()}
        className={`
          aspect-video rounded-xl border-2 border-dashed
          flex flex-col items-center justify-center gap-2
          cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary hover:bg-background'
          }
        `}
      >
        <input {...getInputProps()} />
        {imageError ? (
          <>
            <ImageIcon className="w-6 h-6 text-error" />
            <span className="text-sm text-error">Erro ao carregar imagem</span>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-text-secondary" />
            <span className="text-sm text-text-secondary">
              {isDragActive ? 'Solte a imagem aqui' : label}
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {renderContent()}
    </div>
  )
} 