'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AppConfig {
  integration_api_key: string | null
}

export default function ApiSettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    const { data } = await supabase
      .from('app_config')
      .select('integration_api_key')
      .eq('is_active', true)
      .single()

    setConfig(data)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function generateNewApiKey() {
    try {
      setIsLoading(true)

      const { data: config } = await supabase
        .from('app_config')
        .select('id')
        .eq('is_active', true)
        .single()

      if (!config) {
        throw new Error('Configuração não encontrada')
      }

      const { error } = await supabase
        .from('app_config')
        .update({
          integration_api_key: crypto.randomUUID(),
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)

      if (error) throw error

      await loadConfig()

      toast({
        title: 'Nova API key gerada com sucesso',
        description: 'Lembre-se de atualizar suas integrações com a nova chave.'
      })

    } catch (error) {
      console.error('Erro ao gerar nova API key:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar nova API key',
        description: 'Por favor, tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Configurações da API</h1>
        <p className="text-slate-600 mb-8">
          Gerencie sua API key para integrar o Simplo com outros sistemas.
        </p>

        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-6">
          {/* API Key */}
          <div>
            <h2 className="text-lg font-medium mb-4">API Key</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sua API Key:</span>
                <button
                  onClick={() => config?.integration_api_key && copyToClipboard(config.integration_api_key)}
                  className="text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <code className="block bg-white p-3 rounded border border-slate-200 font-mono text-sm">
                {config?.integration_api_key || 'Nenhuma API key gerada'}
              </code>
            </div>
          </div>

          {/* Gerar Nova Key */}
          <div>
            <h2 className="text-lg font-medium mb-4">Gerar Nova API Key</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                Ao gerar uma nova API key, a chave anterior será invalidada imediatamente.
                Certifique-se de atualizar todas as suas integrações com a nova chave.
              </p>
              <Button
                onClick={generateNewApiKey}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Nova API Key'
                )}
              </Button>
            </div>
          </div>

          {/* Documentação */}
          <div>
            <h2 className="text-lg font-medium mb-4">Documentação</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-4">
                Consulte nossa documentação para aprender como integrar o Simplo com seus sistemas.
              </p>
              <Button variant="outline" asChild>
                <a href="/api/docs" target="_blank">
                  Ver Documentação
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 