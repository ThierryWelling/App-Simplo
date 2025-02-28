-- Criação da tabela de páginas de agradecimento
create table if not exists public.thank_you_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  slug text not null unique,
  message text not null,
  logo_url text,
  background_url text,
  redirect_url text,
  redirect_delay integer,
  colors jsonb not null default '{
    "background": "#FFFFFF",
    "text": "#000000"
  }',
  published boolean default false,
  landing_page_id uuid references public.landing_pages(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Função para atualizar o updated_at automaticamente
create or replace function public.handle_thank_you_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Remover trigger se existir e criar novamente
drop trigger if exists handle_thank_you_pages_updated_at on public.thank_you_pages;
create trigger handle_thank_you_pages_updated_at
  before update on public.thank_you_pages
  for each row
  execute function public.handle_thank_you_pages_updated_at();

-- Políticas de segurança RLS (Row Level Security)
alter table public.thank_you_pages enable row level security;

-- Criar política para permitir leitura pública de páginas publicadas
drop policy if exists "Permitir leitura pública de páginas de agradecimento publicadas" on public.thank_you_pages;
create policy "Permitir leitura pública de páginas de agradecimento publicadas"
  on public.thank_you_pages for select
  using (published = true);

-- Criar política para permitir todas as operações para usuários autenticados
drop policy if exists "Permitir todas as operações para usuários autenticados" on public.thank_you_pages;
create policy "Permitir todas as operações para usuários autenticados"
  on public.thank_you_pages for all
  using (auth.role() = 'authenticated');

-- Criar índices para melhor performance
create index if not exists thank_you_pages_landing_page_id_idx on public.thank_you_pages(landing_page_id);
create index if not exists thank_you_pages_slug_idx on public.thank_you_pages(slug);
create index if not exists thank_you_pages_published_idx on public.thank_you_pages(published);

-- Comentários para documentação
comment on table public.thank_you_pages is 'Tabela para armazenar páginas de agradecimento';
comment on column public.thank_you_pages.id is 'ID único da página de agradecimento';
comment on column public.thank_you_pages.title is 'Título da página de agradecimento';
comment on column public.thank_you_pages.description is 'Descrição para SEO';
comment on column public.thank_you_pages.slug is 'URL amigável única';
comment on column public.thank_you_pages.message is 'Mensagem principal da página';
comment on column public.thank_you_pages.logo_url is 'URL do logo (herdado da landing page)';
comment on column public.thank_you_pages.background_url is 'URL da imagem de fundo';
comment on column public.thank_you_pages.redirect_url is 'URL para redirecionamento (opcional)';
comment on column public.thank_you_pages.redirect_delay is 'Tempo em segundos para redirecionamento';
comment on column public.thank_you_pages.colors is 'Cores da página (fundo e texto)';
comment on column public.thank_you_pages.published is 'Status de publicação';
comment on column public.thank_you_pages.landing_page_id is 'Referência à landing page de vendas';
comment on column public.thank_you_pages.created_at is 'Data de criação';
comment on column public.thank_you_pages.updated_at is 'Data da última atualização';
