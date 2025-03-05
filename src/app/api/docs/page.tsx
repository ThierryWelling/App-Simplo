'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Copy, Check } from 'lucide-react'

interface AppConfig {
  integration_api_key: string | null
}

export default function ApiDocsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    loadConfig()
    setBaseUrl(process.env.NEXT_PUBLIC_API_URL || window.location.origin)
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Documentação da API</h1>
        <p className="text-slate-600 mb-8">
          Use nossa API para acessar seus leads programaticamente.
        </p>

        {/* Autenticação */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Autenticação</h2>
          <p className="mb-4">
            Todas as requisições precisam incluir sua API key no header <code className="bg-slate-100 px-2 py-1 rounded">X-API-Key</code>.
          </p>

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
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Endpoints</h2>

          {/* Listar Leads */}
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-2">Listar Leads</h3>
            <p className="mb-4">Retorna uma lista de todos os seus leads.</p>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">GET</span>
                <code className="text-sm">{baseUrl}/api/leads</code>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Parâmetros de Query:</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-600">
                  <li><code>page</code> - Número da página (padrão: 1)</li>
                  <li><code>limit</code> - Itens por página (padrão: 10, max: 100)</li>
                  <li><code>landing_page_id</code> - Filtrar por landing page específica</li>
                  <li><code>start_date</code> - Data inicial (YYYY-MM-DD)</li>
                  <li><code>end_date</code> - Data final (YYYY-MM-DD)</li>
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Exemplo de Resposta:</h4>
                <pre className="bg-white p-3 rounded border border-slate-200 text-sm overflow-auto">
{`{
  "data": [
    {
      "id": "uuid",
      "created_at": "2024-03-05T14:00:00Z",
      "landing_page_id": "uuid",
      "landing_page": {
        "title": "Nome da Landing Page",
        "slug": "url-da-pagina"
      },
      "data": {
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "11999999999"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "total_pages": 10,
    "total_items": 100
  }
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Obter Lead por ID */}
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-2">Obter Lead por ID</h3>
            <p className="mb-4">Retorna os detalhes de um lead específico.</p>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">GET</span>
                <code className="text-sm">{baseUrl}/api/leads/:id</code>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Exemplo de Resposta:</h4>
                <pre className="bg-white p-3 rounded border border-slate-200 text-sm overflow-auto">
{`{
  "id": "uuid",
  "created_at": "2024-03-05T14:00:00Z",
  "landing_page_id": "uuid",
  "landing_page": {
    "title": "Nome da Landing Page",
    "slug": "url-da-pagina"
  },
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Códigos de Erro */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Códigos de Erro</h2>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-500">401</span>
                <span>API key inválida ou não fornecida</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-500">403</span>
                <span>Sem permissão para acessar este recurso</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-500">404</span>
                <span>Lead não encontrado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-500">429</span>
                <span>Muitas requisições. Aguarde alguns minutos</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Exemplos de Código */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Exemplos de Código</h2>

          {/* cURL */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">cURL</h3>
            <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm overflow-auto">
{`curl "${baseUrl}/api/leads" \\
  -H "X-API-Key: sua-api-key"`}
            </pre>
          </div>

          {/* JavaScript */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">JavaScript</h3>
            <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm overflow-auto">
{`const response = await fetch("${baseUrl}/api/leads", {
  headers: {
    "X-API-Key": "sua-api-key"
  }
});

const data = await response.json();`}
            </pre>
          </div>

          {/* Python */}
          <div>
            <h3 className="text-lg font-medium mb-2">Python</h3>
            <pre className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm overflow-auto">
{`import requests

response = requests.get(
    "${baseUrl}/api/leads",
    headers={"X-API-Key": "sua-api-key"}
)

data = response.json()`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
} 