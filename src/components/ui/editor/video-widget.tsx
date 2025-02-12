'use client'

import { useState } from 'react'
import { Video, Move } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface VideoWidgetProps {
  id: string
  url?: string
  onEdit?: (url: string) => void
  isPreview?: boolean
  position?: { x: number; y: number }
}

export function VideoWidget({
  id,
  url = '',
  onEdit,
  isPreview = false,
  position = { x: 0, y: 0 }
}: VideoWidgetProps) {
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
            <Video className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Vídeo</span>
          </div>
          <Move className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400">Arraste para adicionar vídeo</p>
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
        top: position.y
      }}
      className="group relative w-[400px]"
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <div className="glass-effect rounded-lg p-4">
          <input
            type="text"
            value={url}
            onChange={(e) => onEdit?.(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Cole a URL do vídeo (YouTube, Vimeo)"
          />
        </div>
      ) : url ? (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="aspect-video glass-effect rounded-lg flex items-center justify-center cursor-pointer"
        >
          <div className="text-center">
            <Video className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="mt-2 text-sm text-zinc-400">Clique para adicionar vídeo</p>
          </div>
        </div>
      )}
    </div>
  )
} 