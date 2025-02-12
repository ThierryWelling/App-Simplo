'use client'

import { useState } from 'react'
import { Type, Move } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface TextWidgetProps {
  id: string
  content?: string
  onEdit?: (content: string) => void
  isPreview?: boolean
  position?: { x: number; y: number }
}

export function TextWidget({
  id,
  content = 'Digite seu texto aqui',
  onEdit,
  isPreview = false,
  position = { x: 0, y: 0 }
}: TextWidgetProps) {
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
            <Type className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Texto</span>
          </div>
          <Move className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400">Arraste para adicionar texto</p>
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
      className="group relative min-w-[200px]"
      {...attributes}
      {...listeners}
    >
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onEdit?.(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="w-full p-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="p-2 rounded-lg hover:bg-zinc-800/50 cursor-text"
        >
          {content}
        </div>
      )}
    </div>
  )
} 