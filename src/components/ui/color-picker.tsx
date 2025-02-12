'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const defaultColors = [
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#000000', // black
  '#ffffff', // white
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
      >
        <div className="flex items-center space-x-2">
          <div
            className="w-5 h-5 rounded-full border border-zinc-700/50"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-zinc-300">{value}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 w-full mt-2 p-2 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl"
          >
            <div className="grid grid-cols-4 gap-2 mb-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color)
                    setCustomColor(color)
                    setIsOpen(false)
                  }}
                  className="relative w-8 h-8 rounded-full border border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{ backgroundColor: color }}
                >
                  {value === color && (
                    <Check
                      className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                        color === '#ffffff' ? 'text-black' : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  onChange(e.target.value)
                }}
                className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  onChange(e.target.value)
                }}
                className="flex-1 px-2 py-1 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="#000000"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 