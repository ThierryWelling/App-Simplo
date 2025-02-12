-- Atualiza a tabela de leads para suportar dados dinâmicos
alter table public.leads
add column if not exists form_data jsonb default '{}'::jsonb,
add column if not exists metadata jsonb default '{}'::jsonb,
add column if not exists source text,
add column if not exists utm_source text,
add column if not exists utm_medium text,
add column if not exists utm_campaign text,
add column if not exists ip_address text,
add column if not exists user_agent text,
add column if not exists referrer text;

-- Cria índices para melhor performance nas buscas
create index if not exists leads_created_at_idx on public.leads using brin (created_at);
create index if not exists leads_page_id_created_at_idx on public.leads (page_id, created_at desc);
create index if not exists leads_form_data_gin_idx on public.leads using gin (form_data);

-- Função para buscar leads com filtros
create or replace function public.search_leads(
  page_ids text[],
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  search_query text default null,
  limit_val integer default 50,
  offset_val integer default 0
)
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  form_data jsonb,
  metadata jsonb,
  page_id uuid,
  created_at timestamp with time zone,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  total_count bigint
) as $$
begin
  return query
  with filtered_leads as (
    select l.*
    from public.leads l
    where
      (page_ids is null or l.page_id = any(page_ids::uuid[]))
      and (start_date is null or l.created_at >= start_date)
      and (end_date is null or l.created_at <= end_date)
      and (
        search_query is null
        or l.email ilike '%' || search_query || '%'
        or l.name ilike '%' || search_query || '%'
        or l.phone ilike '%' || search_query || '%'
        or l.form_data::text ilike '%' || search_query || '%'
      )
  )
  select
    fl.*,
    count(*) over() as total_count
  from filtered_leads fl
  order by fl.created_at desc
  limit limit_val
  offset offset_val;
end;
$$ language plpgsql security definer; 