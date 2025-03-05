-- Criar tabela de visualizações de página
create table if not exists public.page_views (
  id uuid default gen_random_uuid() primary key,
  landing_page_id uuid references public.landing_pages(id) on delete cascade,
  session_id text not null,
  referrer text,
  user_agent text,
  duration_seconds integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de eventos
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  landing_page_id uuid references public.landing_pages(id) on delete cascade,
  session_id text not null,
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de segurança RLS
alter table public.page_views enable row level security;
alter table public.analytics_events enable row level security;

-- Permitir inserção pública
create policy "Permitir inserção pública de page views"
  on public.page_views for insert
  with check (true);

create policy "Permitir inserção pública de eventos"
  on public.analytics_events for insert
  with check (true);

-- Permitir leitura apenas para usuários autenticados
create policy "Permitir leitura de page views para usuários autenticados"
  on public.page_views for select
  using (auth.role() = 'authenticated');

create policy "Permitir leitura de eventos para usuários autenticados"
  on public.analytics_events for select
  using (auth.role() = 'authenticated');

-- Criar view para métricas agregadas
create or replace view public.landing_page_metrics as
select
  lp.id as landing_page_id,
  lp.title as landing_page_title,
  lp.slug,
  count(distinct pv.session_id) as total_visitors,
  count(distinct l.id) as total_leads,
  round(count(distinct l.id)::numeric / nullif(count(distinct pv.session_id), 0) * 100, 2) as conversion_rate,
  round(avg(pv.duration_seconds)::numeric, 2) as avg_duration_seconds,
  count(distinct case when pv.referrer like '%google%' then pv.session_id end) as visitors_from_google,
  count(distinct case when pv.referrer like '%facebook%' then pv.session_id end) as visitors_from_facebook,
  count(distinct case when pv.referrer like '%instagram%' then pv.session_id end) as visitors_from_instagram,
  count(distinct case when pv.referrer not like '%google%' 
    and pv.referrer not like '%facebook%'
    and pv.referrer not like '%instagram%'
    and pv.referrer is not null then pv.session_id end) as visitors_from_other
from public.landing_pages lp
left join public.page_views pv on pv.landing_page_id = lp.id
left join public.leads l on l.landing_page_id = lp.id
group by lp.id, lp.title, lp.slug; 