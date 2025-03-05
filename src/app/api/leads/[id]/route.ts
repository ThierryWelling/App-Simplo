import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key não fornecida' },
        { status: 401 }
      )
    }

    // Buscar configuração ativa
    const { data: config } = await supabase
      .from('app_config')
      .select('integration_api_key')
      .eq('is_active', true)
      .single()

    if (!config || config.integration_api_key !== apiKey) {
      return NextResponse.json(
        { error: 'API key inválida' },
        { status: 401 }
      )
    }

    // Buscar lead
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        id,
        created_at,
        landing_page_id,
        landing_page:landing_pages (
          title,
          slug
        ),
        data
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Lead não encontrado' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(lead)

  } catch (error) {
    console.error('Erro ao buscar lead:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 