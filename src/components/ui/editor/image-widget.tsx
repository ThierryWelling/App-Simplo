'use client'

import { useState } from 'react'
import { Image as ImageIcon, Move, Settings } from 'lucide-react'
import { FileUpload } from '../file-upload'
import { useDraggable } from '@dnd-kit/core'
import Image from 'next/image'

interface ImageWidgetProps {
  id: string
  src?: string
  onUpload?: (url: string) => void
  onConfigChange?: (config: ImageConfig) => void
  isPreview?: boolean
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  config?: ImageConfig
  onSelect?: () => void
  isSelected?: boolean
}

interface ImageConfig {
  borderRadius?: number
  shadow?: boolean
  opacity?: number
  fit?: 'cover' | 'contain' | 'fill'
  filter?: {
    brightness: number
    contrast: number
    blur: number
    grayscale: number
  }
  border?: {
    width: number
    color: string
    style: 'solid' | 'dashed' | 'dotted'
  }
}

const defaultConfig: ImageConfig = {
  borderRadius: 8,
  shadow: false,
  opacity: 100,
  fit: 'cover',
  filter: {
    brightness: 100,
    contrast: 100,
    blur: 0,
    grayscale: 0
  },
  border: {
    width: 0,
    color: '#ffffff',
    style: 'solid'
  }
}

export function ImageWidget({ 
  id, 
  src, 
  onUpload,
  onConfigChange,
  isPreview = false,
  position = { x: 0, y: 0 },
  size = { width: 300, height: 200 },
  config = defaultConfig,
  onSelect,
  isSelected = false
}: ImageWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !isPreview
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  if (!isPreview) {
    return (
      <div className="glass-effect rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Imagem</span>
          </div>
          <Move className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-zinc-500" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
      className={`group relative ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onSelect}
    >
      <div className="relative">
        {src ? (
          <div className="relative group">
            <img
              src={src}
              alt=""
              className="w-full h-full transition-all duration-200"
              style={{
                borderRadius: `${config.borderRadius}px`,
                opacity: (config.opacity ?? 100) / 100,
                objectFit: config.fit as 'cover' | 'contain' | 'fill',
                filter: `brightness(${config.filter?.brightness}%) contrast(${config.filter?.contrast}%) blur(${config.filter?.blur}px) grayscale(${config.filter?.grayscale}%)`,
                border: config.border?.width ? `${config.border.width}px ${config.border.style} ${config.border.color}` : 'none',
                boxShadow: config.shadow ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.()
                  onConfigChange?.(config)
                }}
                className="p-2 rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-4 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm mt-2 block">Adicionar Imagem</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-effect rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Selecionar Imagem</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
              >
                <Move className="w-5 h-5" />
              </button>
            </div>
            <FileUpload
              value={src}
              onChange={(url) => {
                if (onUpload) onUpload(url)
                setIsEditing(false)
              }}
              onUpload={async (file) => {
                // Aqui você implementa o upload da imagem
                return URL.createObjectURL(file)
              }}
              accept="image/*"
            />
          </div>
        </div>
      )}
    </div>
  )
} 