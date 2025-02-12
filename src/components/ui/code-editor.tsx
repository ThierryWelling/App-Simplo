'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Editor de HTML</h3>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="px-4 py-2 text-sm rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          {preview ? 'Voltar ao Editor' : 'Visualizar'}
        </button>
      </div>

      {preview ? (
        <div className="glass-effect rounded-lg p-4 min-h-[400px]">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      ) : (
        <div className="glass-effect rounded-lg overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage="html"
            theme="vs-dark"
            value={value}
            onChange={(value) => onChange(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}
    </div>
  )
} 