-- Remove a função se ela existir
drop function if exists public.get_dashboard_stats(uuid, timestamp with time zone, timestamp with time zone);

-- Função para buscar estatísticas do dashboard
create or replace function public.get_dashboard_stats(
  p_user_id uuid,
  p_start_date timestamp with time zone default (now() - interval '30 days'),
  p_end_date timestamp with time zone default now()
)
returns jsonb as $$
declare
  prev_period_start timestamp with time zone;
  prev_period_end timestamp with time zone;
  current_leads bigint;
  previous_leads bigint;
  result jsonb;
begin
  -- Adiciona índices para melhorar performance
  create index if not exists idx_leads_created_at on public.leads(created_at);
  create index if not exists idx_landing_pages_user_id on public.landing_pages(user_id);

  -- Calcula período anterior para comparação
  prev_period_start := p_start_date - (p_end_date - p_start_date);
  prev_period_end := p_start_date;

  -- Materializa os dados básicos em uma CTE para reutilização
  with base_data as (
    select l.*, lp.title as page_title, lp.views
    from public.leads l
    join public.landing_pages lp on l.page_id = lp.id
    where lp.user_id = p_user_id
    and l.created_at between prev_period_start and p_end_date
  ),
  current_period as (
    select * from base_data
    where created_at between p_start_date and p_end_date
  ),
  previous_period as (
    select * from base_data
    where created_at between prev_period_start and prev_period_end
  )

  -- Constrói o resultado como JSONB de forma mais eficiente
  select jsonb_build_object(
    'total_leads', (select count(*) from current_period),
    'total_landing_pages', (
      select count(*)
      from public.landing_pages
      where user_id = p_user_id
    ),
    'conversion_rate', (
      select 
        case 
          when sum(views) > 0 then 
            round((count(l.id)::numeric / sum(views)::numeric) * 100, 2)
          else 0 
        end
      from public.landing_pages lp
      left join current_period l on l.page_id = lp.id
      where lp.user_id = p_user_id
    ),
    'leads_by_day', coalesce(
      (
        select jsonb_agg(row_to_json(stats))
        from (
          select 
            date_trunc('day', created_at)::date as date,
            count(*) as count
          from current_period
          group by date_trunc('day', created_at)
          order by date_trunc('day', created_at)
        ) stats
      ),
      '[]'::jsonb
    ),
    'leads_by_page', coalesce(
      (
        select jsonb_agg(row_to_json(stats))
        from (
          select 
            page_title as title,
            count(*) as count
          from current_period
          group by page_title
          order by count(*) desc
          limit 5
        ) stats
      ),
      '[]'::jsonb
    ),
    'leads_by_source', coalesce(
      (
        select jsonb_agg(row_to_json(stats))
        from (
          select 
            coalesce(source, 'Direto') as source,
            count(*) as count
          from current_period
          group by coalesce(source, 'Direto')
          order by count(*) desc
          limit 5
        ) stats
      ),
      '[]'::jsonb
    ),
    'recent_leads', coalesce(
      (
        select jsonb_agg(row_to_json(leads))
        from (
          select 
            id,
            name,
            email,
            created_at,
            page_title,
            coalesce(source, 'Direto') as source
          from current_period
          order by created_at desc
          limit 5
        ) leads
      ),
      '[]'::jsonb
    )
  ) into result;

  -- Retorna o resultado
  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql security definer;

-- Garante permissões para a função
grant execute on function public.get_dashboard_stats(uuid, timestamp with time zone, timestamp with time zone) to authenticated; 