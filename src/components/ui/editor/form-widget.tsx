'use client'

import { useState } from 'react'
import { FormInput, Move, Settings } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

interface FormWidgetProps {
  id: string
  fields?: FormField[]
  onEdit?: (fields: FormField[]) => void
  onConfigChange?: (config: FormConfig) => void
  isPreview?: boolean
  position?: { x: number; y: number }
  config?: FormConfig
  onSelect?: () => void
  isSelected?: boolean
}

interface FormField {
  id: string
  type: 'text' | 'email' | 'tel'
  label: string
  required: boolean
}

interface FormConfig {
  borderRadius: number
  backgroundColor: string
  buttonStyle: 'solid' | 'outline' | 'gradient'
  buttonColor: 'blue' | 'purple' | 'pink'
  labelColor: string
  inputStyle: 'outline' | 'filled'
}

const defaultConfig: FormConfig = {
  borderRadius: 8,
  backgroundColor: 'rgba(24, 24, 27, 0.5)',
  buttonStyle: 'gradient',
  buttonColor: 'purple',
  labelColor: '#ffffff',
  inputStyle: 'outline'
}

const defaultFields: FormField[] = [
  { id: 'name', type: 'text', label: 'Nome', required: true },
  { id: 'email', type: 'email', label: 'Email', required: true }
]

export function FormWidget({
  id,
  fields = defaultFields,
  onEdit,
  onConfigChange,
  isPreview = false,
  position = { x: 0, y: 0 },
  config = defaultConfig,
  onSelect,
  isSelected = false
}: FormWidgetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !isPreview
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const getButtonStyles = () => {
    const styles = {
      solid: {
        blue: 'bg-blue-500 hover:bg-blue-600',
        purple: 'bg-purple-500 hover:bg-purple-600',
        pink: 'bg-pink-500 hover:bg-pink-600'
      },
      outline: {
        blue: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
        purple: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white',
        pink: 'border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white'
      },
      gradient: {
        blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
        purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
        pink: 'bg-gradient-to-r from-pink-500 to-pink-600'
      }
    }

    return `${styles[config.buttonStyle][config.buttonColor]} text-white`
  }

  const getInputStyles = () => {
    return config.inputStyle === 'outline'
      ? 'bg-transparent border border-zinc-700/50'
      : 'bg-zinc-800/50 border-transparent'
  }

  if (!isPreview) {
    return (
      <div className="glass-effect rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FormInput className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Formulário</span>
          </div>
          <Move className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-400">Arraste para adicionar formulário</p>
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
      className={`group relative w-[300px] ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onSelect}
    >
      <div className="relative">
        <div className="relative group">
          <form 
            className="glass-effect rounded-lg p-4 space-y-4"
            style={{ 
              borderRadius: `${config.borderRadius}px`,
              backgroundColor: config.backgroundColor
            }}
          >
            {fields.map((field) => (
              <div key={field.id}>
                <label 
                  className="block text-sm font-medium mb-1"
                  style={{ color: config.labelColor }}
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type={field.type}
                  required={field.required}
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${getInputStyles()}`}
                  placeholder={`Digite seu ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
            <button
              type="submit"
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyles()}`}
            >
              Enviar
            </button>
          </form>
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
      </div>
    </div>
  )
} 