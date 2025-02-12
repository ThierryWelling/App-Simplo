'use client'

import { useState } from 'react'
import { Square, Move, Settings } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface ButtonWidgetProps {
  id: string
  text?: string
  onEdit?: (text: string) => void
  onConfigChange?: (config: ButtonConfig) => void
  isPreview?: boolean
  position?: { x: number; y: number }
  config?: ButtonConfig
  onSelect?: () => void
  isSelected?: boolean
}

interface ButtonConfig {
  variant: 'solid' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  borderRadius: number
  colorScheme: 'blue' | 'purple' | 'pink' | 'gradient'
  shadow: boolean
  padding: {
    x: number
    y: number
  }
  font: {
    weight: 'normal' | 'medium' | 'semibold' | 'bold'
    transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  }
}

const defaultConfig: ButtonConfig = {
  variant: 'solid',
  size: 'md',
  borderRadius: 8,
  colorScheme: 'gradient',
  shadow: false,
  padding: {
    x: 4,
    y: 2
  },
  font: {
    weight: 'medium',
    transform: 'none'
  }
}

export function ButtonWidget({
  id,
  text = 'Clique aqui',
  onEdit,
  onConfigChange,
  isPreview = false,
  position = { x: 0, y: 0 },
  config = defaultConfig,
  onSelect,
  isSelected = false
}: ButtonWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !isPreview
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const getButtonStyles = () => {
    const baseStyles = 'transition-all duration-200'
    const sizeStyles = {
      sm: `px-${config.padding.x} py-${config.padding.y} text-sm`,
      md: `px-${config.padding.x} py-${config.padding.y}`,
      lg: `px-${config.padding.x} py-${config.padding.y} text-lg`
    }
    const variantStyles = {
      solid: {
        blue: 'bg-blue-500 hover:bg-blue-600 text-white',
        purple: 'bg-purple-500 hover:bg-purple-600 text-white',
        pink: 'bg-pink-500 hover:bg-pink-600 text-white',
        gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
      },
      outline: {
        blue: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
        purple: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white',
        pink: 'border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white',
        gradient: 'border-2 border-purple-500 text-purple-500 hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent'
      },
      ghost: {
        blue: 'text-blue-500 hover:bg-blue-500/10',
        purple: 'text-purple-500 hover:bg-purple-500/10',
        pink: 'text-pink-500 hover:bg-pink-500/10',
        gradient: 'bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 hover:from-blue-500/10 hover:via-purple-500/10 hover:to-pink-500/10 text-purple-500'
      }
    }

    const fontStyles = `font-${config.font.weight} ${
      config.font.transform !== 'none' ? `text-${config.font.transform}` : ''
    }`

    const shadowStyles = config.shadow ? 'shadow-lg hover:shadow-xl' : ''

    return `${baseStyles} ${sizeStyles[config.size]} ${variantStyles[config.variant][config.colorScheme]} ${fontStyles} ${shadowStyles}`
  }

  if (!isPreview) {
    return (
      <div className="glass-effect rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Square className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Botão</span>
          </div>
          <Move className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400">Arraste para adicionar botão</p>
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
      className={`group relative ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onSelect}
    >
      <div className="relative">
        {isEditing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => onEdit?.(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        ) : (
          <div className="relative group">
            <button
              onClick={() => setIsEditing(true)}
              className={getButtonStyles()}
              style={{ borderRadius: `${config.borderRadius}px` }}
            >
              {text}
            </button>
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
        )}
      </div>
    </div>
  )
} 