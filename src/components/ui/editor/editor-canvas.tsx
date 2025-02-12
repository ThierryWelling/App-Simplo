'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  DndContext, 
  DragEndEvent,
  useDraggable, 
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier
} from '@dnd-kit/core'
import { Rnd, DraggableData, RndResizeCallback } from 'react-rnd'
import { ImageWidget } from './image-widget'
import { TextWidget } from './text-widget'
import { ButtonWidget } from './button-widget'
import { FormWidget } from './form-widget'
import { VideoWidget } from './video-widget'
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Undo, 
  Redo, 
  Grid3X3,
  Image,
  Type,
  Square,
  FormInput,
  Video,
  Heading1,
  Text,
  Link2,
  List,
  ListOrdered,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  X
} from 'lucide-react'
import { v4 as uuid } from 'uuid'

interface EditorCanvasProps {
  value?: Array<{
    id: string
    type: string
    config: any
    content?: string
    position: { x: number, y: number }
    size: { width: number, height: number }
  }>
  onChange?: (widgets: Array<{
    id: string
    type: string
    config: any
    content?: string
    position: { x: number, y: number }
    size: { width: number, height: number }
  }>) => void
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'
type ElementType = 'image' | 'text' | 'button' | 'form' | 'video' | 'heading' | 'text' | 'link' | 'list' | 'ordered-list'

interface Element {
  id: string
  type: ElementType
  props: any
  position: { x: number; y: number }
  size: { width: number; height: number }
  config?: any
}

const defaultImageConfig = {
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

const defaultButtonConfig = {
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

const defaultFormConfig = {
  borderRadius: 8,
  backgroundColor: 'rgba(24, 24, 27, 0.5)',
  buttonStyle: 'gradient',
  buttonColor: 'purple',
  labelColor: '#ffffff',
  inputStyle: 'outline'
}

const widgetGroups = [
  {
    title: "Elementos Básicos",
    widgets: [
      { type: 'image', icon: Image, label: 'Imagem' },
      { type: 'button', icon: Square, label: 'Botão' },
      { type: 'form', icon: FormInput, label: 'Formulário' },
      { type: 'video', icon: Video, label: 'Vídeo' },
    ]
  },
  {
    title: "Texto e Conteúdo",
    widgets: [
      { type: 'heading', icon: Heading1, label: 'Título' },
      { type: 'text', icon: Text, label: 'Texto' },
      { type: 'link', icon: Link2, label: 'Link' },
      { type: 'list', icon: List, label: 'Lista' },
      { type: 'ordered-list', icon: ListOrdered, label: 'Lista Numerada' },
    ]
  }
]

// Adicione essas constantes para estilos consistentes
const GRID_SIZE = 20
const TRANSITION_DURATION = '0.2s'

export function EditorCanvas({ value, onChange }: EditorCanvasProps) {
  const [widgets, setWidgets] = useState(value || [])
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [elements, setElements] = useState<Element[]>([])
  const [history, setHistory] = useState<Element[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showGrid, setShowGrid] = useState(true)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(70)
  const [isConfiguringElement, setIsConfiguringElement] = useState(false)
  const { setNodeRef } = useDroppable({ id: 'canvas' })

  // Configurar sensores
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

  // Atualiza os widgets quando o valor muda
  useEffect(() => {
    if (value) {
      setWidgets(value)
    }
  }, [value])

  // Notifica mudanças nos widgets
  useEffect(() => {
    if (onChange) {
      onChange(widgets)
    }
  }, [widgets, onChange])

  const addToHistory = useCallback((newState: Element[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newState])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setElements(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setElements(history[historyIndex + 1])
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const isNewElement = active.id.toString().startsWith('widget-')

    if (isNewElement) {
      const type = active.id.toString().replace('widget-', '') as ElementType
      const canvasRect = document.querySelector('.canvas-area')?.getBoundingClientRect()
      
      if (canvasRect) {
        const newElement: Element = {
          id: `element-${Date.now()}`,
          type,
          props: {},
          position: {
            x: event.delta.x,
            y: event.delta.y
          },
          size: {
            width: 200,
            height: type === 'form' ? 300 : 100
          }
        }

        setElements(prev => [...prev, newElement])
        addToHistory([...elements, newElement])
        setSelectedWidget(newElement.id)
      }
    }

    setActiveId(null)
  }

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
    addToHistory(elements)
  }

  const addElement = (type: ElementType) => {
    // Calcula a posição central do canvas
    const canvas = document.querySelector('.canvas-area')
    let x = 20
    let y = 20
    
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      x = rect.width / 2 - 100 // 100 é uma largura aproximada do elemento
      y = rect.height / 2 - 50 // 50 é uma altura aproximada do elemento
    }

    const newElement: Element = {
      id: `${type}-${Date.now()}`,
      type,
      props: {},
      position: { x, y },
      size: {
        width: 200,
        height: type === 'form' ? 300 : 100
      }
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    addToHistory(newElements)
  }

  const deviceStyles = {
    desktop: 'w-full max-w-[1200px] h-[600px]',
    tablet: 'w-[768px] h-[1024px]',
    mobile: 'w-[375px] h-[667px]'
  }

  const handleElementSelect = (id: string) => {
    setSelectedWidget(id)
  }

  const handleConfigClick = (id: string) => {
    setSelectedWidget(id)
    setShowConfigPanel(true)
  }

  const renderElement = (element: Element) => {
    const props = {
      ...element.props,
      id: element.id,
      isPreview: true,
      onEdit: (value: any) => {
        updateElement(element.id, { props: { ...element.props, ...value } })
      },
      onConfigChange: (config: any) => {
        updateElement(element.id, { config })
        setShowConfigPanel(true)
      },
      config: element.config,
      onSelect: () => handleElementSelect(element.id),
      isSelected: selectedWidget === element.id
    }

    let Component
    switch (element.type) {
      case 'image':
        Component = ImageWidget
        break
      case 'text':
        Component = TextWidget
        break
      case 'button':
        Component = ButtonWidget
        break
      case 'form':
        Component = FormWidget
        break
      case 'video':
        Component = VideoWidget
        break
      default:
        return null
    }

    return (
      <Rnd
        key={element.id}
        position={element.position}
        size={element.size}
        onDragStop={(e, d: DraggableData) => {
          updateElement(element.id, { position: { x: d.x, y: d.y } })
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          updateElement(element.id, {
            position,
            size: {
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height)
            }
          })
        }}
        bounds="parent"
        dragGrid={showGrid ? [GRID_SIZE, GRID_SIZE] : undefined}
        resizeGrid={showGrid ? [GRID_SIZE, GRID_SIZE] : undefined}
        className={`group transition-all duration-200 ${
          selectedWidget === element.id 
            ? 'ring-2 ring-purple-500 ring-offset-4 ring-offset-zinc-900' 
            : 'hover:ring-2 hover:ring-purple-500/50 hover:ring-offset-2 hover:ring-offset-zinc-900'
        }`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation()
          handleElementSelect(element.id)
        }}
      >
        <Component {...props} />
      </Rnd>
    )
  }

  // Função para ajustar o zoom
  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev + 10 : prev - 10
      return Math.min(Math.max(newZoom, 50), 200) // Limita o zoom entre 50% e 200%
    })
  }

  const handleAddWidget = (type: string) => {
    const newWidget = {
      id: uuid(),
      type,
      config: {},
      position: { x: 0, y: 0 },
      size: { width: 300, height: type === 'form' ? 400 : 200 }
    }
    setWidgets([...widgets, newWidget])
    setSelectedWidget(newWidget.id)
  }

  const handleUpdateWidget = (id: string, updates: Partial<typeof widgets[0]>) => {
    setWidgets(widgets.map(widget => 
      widget.id === id ? { ...widget, ...updates } : widget
    ))
  }

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id))
    setSelectedWidget(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior */}
      <div className="glass-effect p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-lg transition-colors ${
              device === 'desktop'
                ? 'bg-purple-500/20 text-purple-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Laptop className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded-lg transition-colors ${
              device === 'tablet'
                ? 'bg-purple-500/20 text-purple-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tablet className="w-5 h-5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-lg transition-colors ${
              device === 'mobile'
                ? 'bg-purple-500/20 text-purple-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Redo className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-purple-500/20 text-purple-500' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom('out')}
              disabled={zoom <= 50}
              className="p-2 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-sm text-zinc-400 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => handleZoom('in')}
              disabled={zoom >= 200}
              className="p-2 rounded-lg text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de edição */}
      <div className="flex-1 min-h-0 p-6">
        <DndContext 
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Painel de Configuração Modal */}
          {selectedWidget && showConfigPanel && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget) {
                setShowConfigPanel(false)
              }
            }}>
              <div className="glass-effect rounded-lg p-6 max-w-[80vw] w-full max-h-[80vh] overflow-y-auto border border-zinc-800/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                    <h3 className="text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
                      Configurações do Elemento
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowConfigPanel(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Conteúdo do painel de configuração baseado no tipo do elemento selecionado */}
                  {elements.find(el => el.id === selectedWidget)?.type === 'image' && (
                    <ImageConfigPanel 
                      element={elements.find(el => el.id === selectedWidget)!}
                      onConfigChange={(config) => updateElement(selectedWidget, { config })}
                    />
                  )}

                  {elements.find(el => el.id === selectedWidget)?.type === 'button' && (
                    <ButtonConfigPanel 
                      element={elements.find(el => el.id === selectedWidget)!}
                      onConfigChange={(config) => updateElement(selectedWidget, { config })}
                    />
                  )}

                  {elements.find(el => el.id === selectedWidget)?.type === 'form' && (
                    <FormConfigPanel 
                      element={elements.find(el => el.id === selectedWidget)!}
                      onConfigChange={(config) => updateElement(selectedWidget, { config })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex h-full">
            {/* Painel lateral */}
            <div className="w-72 glass-effect rounded-lg p-4 mr-6 overflow-y-auto shrink-0 border border-zinc-800/50 backdrop-blur-md">
              <div className="space-y-6">
                {widgetGroups.map((group, index) => (
                  <div key={index} className="pb-6 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center space-x-2 mb-4 px-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                      <h3 className="text-sm font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
                        {group.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {group.widgets.map((widget) => (
                        <div
                          key={widget.type}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleAddWidget(widget.type as ElementType)}
                          className="group relative flex flex-col items-center p-3 rounded-lg transition-all duration-300 hover:bg-zinc-800/50 hover:scale-[1.02] cursor-pointer border border-transparent hover:border-purple-500/20"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 flex items-center justify-center mb-2 transition-all duration-300 group-hover:from-purple-500/20 group-hover:to-blue-500/20 group-hover:scale-110">
                            <widget.icon className="w-5 h-5 text-zinc-400 transition-colors duration-300 group-hover:text-purple-400" />
                          </div>
                          <span className="text-xs text-zinc-400 transition-colors duration-300 group-hover:text-white text-center font-medium">
                            {widget.label}
                          </span>
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 min-w-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm rounded-lg p-8 overflow-auto">
              <div
                ref={setNodeRef}
                className={`canvas-area relative ${deviceStyles[device]} transition-all duration-300 ease-in-out shadow-2xl`}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  if (e.target === e.currentTarget) {
                    setSelectedWidget(null)
                  }
                }}
                style={{
                  background: 'linear-gradient(to bottom right, rgba(24, 24, 27, 0.9), rgba(39, 39, 42, 0.9))',
                  backgroundImage: showGrid
                    ? `
                      linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(to right, rgba(255,255,255,0.05) ${GRID_SIZE}px, transparent ${GRID_SIZE}px),
                      linear-gradient(to bottom, rgba(255,255,255,0.05) ${GRID_SIZE}px, transparent ${GRID_SIZE}px)
                    `
                    : 'none',
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`,
                  boxShadow: '0 0 50px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                {elements.map(renderElement)}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeId && (
              <div className="opacity-50 transition-transform duration-200 scale-105">
                {activeId.startsWith('widget-image') && <ImageWidget id={activeId} isPreview={false} />}
                {activeId.startsWith('widget-text') && <TextWidget id={activeId} isPreview={false} />}
                {activeId.startsWith('widget-button') && <ButtonWidget id={activeId} isPreview={false} />}
                {activeId.startsWith('widget-form') && <FormWidget id={activeId} isPreview={false} />}
                {activeId.startsWith('widget-video') && <VideoWidget id={activeId} isPreview={false} />}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}

// Componentes dos painéis de configuração
function ImageConfigPanel({ element, onConfigChange }: { element: Element, onConfigChange: (config: any) => void }) {
  const config = element.config || defaultImageConfig

  return (
    <>
      {/* Dimensões e Posicionamento */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Dimensões e Posicionamento
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Borda Arredondada
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={config.borderRadius}
              onChange={(e) => onConfigChange({ ...config, borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Ajuste
            </label>
            <select
              value={config.fit}
              onChange={(e) => onConfigChange({ ...config, fit: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="cover">Cobrir</option>
              <option value="contain">Conter</option>
              <option value="fill">Preencher</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aparência */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Aparência
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Opacidade
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.opacity}
              onChange={(e) => onConfigChange({ ...config, opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.shadow}
                onChange={(e) => onConfigChange({ ...config, shadow: e.target.checked })}
                className="rounded border-zinc-700/50"
              />
              <span className="text-sm font-medium text-zinc-300">Sombra</span>
            </label>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Filtros
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Brilho
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={config.filter?.brightness}
              onChange={(e) => onConfigChange({
                ...config,
                filter: {
                  ...config.filter,
                  brightness: Number(e.target.value)
                }
              })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Contraste
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={config.filter?.contrast}
              onChange={(e) => onConfigChange({
                ...config,
                filter: {
                  ...config.filter,
                  contrast: Number(e.target.value)
                }
              })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </>
  )
}

function ButtonConfigPanel({ element, onConfigChange }: { element: Element, onConfigChange: (config: any) => void }) {
  const config = element.config || defaultButtonConfig

  return (
    <>
      {/* Estilo */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Estilo
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Variante
            </label>
            <select
              value={config.variant}
              onChange={(e) => onConfigChange({ ...config, variant: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="solid">Sólido</option>
              <option value="outline">Contorno</option>
              <option value="ghost">Fantasma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Esquema de Cores
            </label>
            <select
              value={config.colorScheme}
              onChange={(e) => onConfigChange({ ...config, colorScheme: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="blue">Azul</option>
              <option value="purple">Roxo</option>
              <option value="pink">Rosa</option>
              <option value="gradient">Gradiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dimensões */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Dimensões
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Tamanho
            </label>
            <select
              value={config.size}
              onChange={(e) => onConfigChange({ ...config, size: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="sm">Pequeno</option>
              <option value="md">Médio</option>
              <option value="lg">Grande</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Borda Arredondada
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={config.borderRadius}
              onChange={(e) => onConfigChange({ ...config, borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Tipografia */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Tipografia
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Peso da Fonte
            </label>
            <select
              value={config.font?.weight}
              onChange={(e) => onConfigChange({
                ...config,
                font: {
                  ...config.font,
                  weight: e.target.value
                }
              })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="normal">Normal</option>
              <option value="medium">Médio</option>
              <option value="semibold">Semi-negrito</option>
              <option value="bold">Negrito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Transformação
            </label>
            <select
              value={config.font?.transform}
              onChange={(e) => onConfigChange({
                ...config,
                font: {
                  ...config.font,
                  transform: e.target.value
                }
              })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="none">Nenhuma</option>
              <option value="uppercase">Maiúsculas</option>
              <option value="lowercase">Minúsculas</option>
              <option value="capitalize">Capitalizado</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

function FormConfigPanel({ element, onConfigChange }: { element: Element, onConfigChange: (config: any) => void }) {
  const config = element.config || defaultFormConfig

  return (
    <>
      {/* Aparência */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Aparência
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Borda Arredondada
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={config.borderRadius}
              onChange={(e) => onConfigChange({ ...config, borderRadius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Cor de Fundo
            </label>
            <input
              type="color"
              value={config.backgroundColor}
              onChange={(e) => onConfigChange({ ...config, backgroundColor: e.target.value })}
              className="w-full h-10 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Campos
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Estilo dos Campos
            </label>
            <select
              value={config.inputStyle}
              onChange={(e) => onConfigChange({ ...config, inputStyle: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="outline">Contorno</option>
              <option value="filled">Preenchido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Cor dos Rótulos
            </label>
            <input
              type="color"
              value={config.labelColor}
              onChange={(e) => onConfigChange({ ...config, labelColor: e.target.value })}
              className="w-full h-10 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Botão */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">
          Botão
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Estilo do Botão
            </label>
            <select
              value={config.buttonStyle}
              onChange={(e) => onConfigChange({ ...config, buttonStyle: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="solid">Sólido</option>
              <option value="outline">Contorno</option>
              <option value="gradient">Gradiente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Cor do Botão
            </label>
            <select
              value={config.buttonColor}
              onChange={(e) => onConfigChange({ ...config, buttonColor: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
            >
              <option value="blue">Azul</option>
              <option value="purple">Roxo</option>
              <option value="pink">Rosa</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
} 