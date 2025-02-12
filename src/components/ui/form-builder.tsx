'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Plus, GripVertical, X, Settings } from 'lucide-react'

type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'number'

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder: string
  required: boolean
}

interface FormBuilderProps {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}

const defaultFields: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Nome',
    placeholder: 'Digite seu nome',
    required: true,
  },
  {
    id: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Digite seu email',
    required: true,
  },
]

export function FormBuilder({ fields = defaultFields, onChange }: FormBuilderProps) {
  const [editingField, setEditingField] = useState<string | null>(null)

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'Novo Campo',
      placeholder: 'Digite aqui',
      required: false,
    }
    onChange([...fields, newField])
    setEditingField(newField.id)
  }

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    )
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onChange(items)
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {fields.map((field, index) => (
                <Draggable
                  key={field.id}
                  draggableId={field.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="glass-effect rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingField === field.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-zinc-300">
                                  Rótulo
                                </label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) =>
                                    updateField(field.id, { label: e.target.value })
                                  }
                                  className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-zinc-300">
                                  Placeholder
                                </label>
                                <input
                                  type="text"
                                  value={field.placeholder}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      placeholder: e.target.value,
                                    })
                                  }
                                  className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md"
                                />
                              </div>
                              <div className="flex items-center space-x-4">
                                <div>
                                  <label className="block text-sm font-medium text-zinc-300">
                                    Tipo
                                  </label>
                                  <select
                                    value={field.type}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        type: e.target.value as FieldType,
                                      })
                                    }
                                    className="mt-1 block w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md"
                                  >
                                    <option value="text">Texto</option>
                                    <option value="email">Email</option>
                                    <option value="tel">Telefone</option>
                                    <option value="textarea">Área de Texto</option>
                                    <option value="number">Número</option>
                                  </select>
                                </div>
                                <div className="flex items-center mt-6">
                                  <input
                                    type="checkbox"
                                    id={`required-${field.id}`}
                                    checked={field.required}
                                    onChange={(e) =>
                                      updateField(field.id, {
                                        required: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 rounded border-zinc-700/50 bg-zinc-800/50"
                                  />
                                  <label
                                    htmlFor={`required-${field.id}`}
                                    className="ml-2 text-sm text-zinc-300"
                                  >
                                    Obrigatório
                                  </label>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab hover:text-purple-500 text-zinc-400"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium">{field.label}</p>
                                <p className="text-sm text-zinc-400">
                                  {field.type} {field.required && '(obrigatório)'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingField(
                                editingField === field.id ? null : field.id
                              )
                            }
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeField(field.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        type="button"
        onClick={addField}
        className="w-full py-3 flex items-center justify-center space-x-2 rounded-lg border-2 border-dashed border-zinc-700 hover:border-purple-500/50 text-zinc-400 hover:text-purple-500 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Adicionar Campo</span>
      </button>
    </div>
  )
} 