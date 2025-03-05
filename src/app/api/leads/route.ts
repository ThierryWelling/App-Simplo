import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  landing_page_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(request: Request) {
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

    // Validar parâmetros
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const query = querySchema.parse(params)

    // Calcular offset para paginação
    const offset = (query.page - 1) * query.limit

    // Construir query base
    let leadsQuery = supabase
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

    // Aplicar filtros
    if (query.landing_page_id) {
      leadsQuery = leadsQuery.eq('landing_page_id', query.landing_page_id)
    }

    if (query.start_date) {
      leadsQuery = leadsQuery.gte('created_at', query.start_date)
    }

    if (query.end_date) {
      leadsQuery = leadsQuery.lte('created_at', query.end_date)
    }

    // Buscar total de registros
    const countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    // Aplicar os mesmos filtros da query principal
    if (query.landing_page_id) {
      countQuery.eq('landing_page_id', query.landing_page_id)
    }

    if (query.start_date) {
      countQuery.gte('created_at', query.start_date)
    }

    if (query.end_date) {
      countQuery.lte('created_at', query.end_date)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    // Buscar leads com paginação
    const { data: leads, error } = await leadsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      data: leads,
      pagination: {
        page: query.page,
        total_pages: Math.ceil((count || 0) / query.limit),
        total_items: count
      }
    })

  } catch (error) {
    console.error('Erro ao buscar leads:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 