'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
}

const fonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Poppins',
  'Raleway',
  'Source Sans Pro',
]

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
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
        <span className="text-sm text-zinc-300" style={{ fontFamily: value }}>
          {value}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 w-full mt-2 py-1 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl"
          >
            {fonts.map((font) => (
              <button
                key={font}
                type="button"
                onClick={() => {
                  onChange(font)
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-3 py-2 hover:bg-zinc-800/50 transition-colors"
              >
                <span
                  className="flex-1 text-sm text-left"
                  style={{ fontFamily: font }}
                >
                  {font}
                </span>
                {value === font && (
                  <Check className="w-4 h-4 text-purple-500" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 