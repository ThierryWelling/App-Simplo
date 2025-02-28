-- Criar tabela de profiles para armazenar informações adicionais dos usuários
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Criar política para permitir leitura pública
drop policy if exists "Permitir leitura pública de profiles" on public.profiles;
create policy "Permitir leitura pública de profiles"
  on public.profiles for select
  using (true);

-- Criar política para permitir atualização pelo próprio usuário
drop policy if exists "Usuários podem atualizar seus próprios profiles" on public.profiles;
create policy "Usuários podem atualizar seus próprios profiles"
  on public.profiles for update
  using (auth.uid() = id);

-- Função para criar profile automaticamente após signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Remover trigger se existir e criar novamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Criação da tabela de landing pages
create table if not exists public.landing_pages (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  slug text not null unique,
  content jsonb not null default '{
    "formType": "system",
    "formPosition": "right",
    "formFields": [],
    "colors": {
      "primary": "#7C3AFF",
      "secondary": "#4CC9F0",
      "background": "#FFFFFF",
      "text": "#1A1F2E"
    },
    "fonts": {
      "title": "Inter",
      "body": "Inter"
    }
  }',
  meta_title text,
  meta_description text,
  ga_id text,
  meta_pixel_id text,
  logo_url text,
  background_url text,
  event_date_image_url text,
  participants_image_url text,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Função para atualizar o updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Remover trigger se existir e criar novamente
drop trigger if exists handle_landing_pages_updated_at on public.landing_pages;
create trigger handle_landing_pages_updated_at
  before update on public.landing_pages
  for each row
  execute function public.handle_updated_at();

-- Políticas de segurança RLS (Row Level Security)
alter table public.landing_pages enable row level security;

-- Criar política para permitir leitura pública de landing pages publicadas
drop policy if exists "Permitir leitura pública de landing pages publicadas" on public.landing_pages;
create policy "Permitir leitura pública de landing pages publicadas"
  on public.landing_pages for select
  using (published = true);

-- Criar política para permitir todas as operações para usuários autenticados
drop policy if exists "Permitir todas as operações para usuários autenticados" on public.landing_pages;
create policy "Permitir todas as operações para usuários autenticados"
  on public.landing_pages for all
  using (auth.role() = 'authenticated');

-- Criação da tabela de leads
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  landing_page_id uuid references public.landing_pages(id) on delete cascade,
  name text,
  email text not null,
  phone text,
  data jsonb not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de segurança RLS para leads
alter table public.leads enable row level security;

-- Criar política para permitir inserção pública de leads
drop policy if exists "Permitir inserção pública de leads" on public.leads;
create policy "Permitir inserção pública de leads"
  on public.leads for insert
  with check (true);

-- Criar política para permitir leitura de leads apenas para usuários autenticados
drop policy if exists "Permitir leitura de leads para usuários autenticados" on public.leads;
create policy "Permitir leitura de leads para usuários autenticados"
  on public.leads for select
  using (auth.role() = 'authenticated');

-- Criar buckets para armazenamento de arquivos
insert into storage.buckets (id, name, public)
values ('landing-pages', 'landing-pages', true);

-- Criar políticas de acesso para o bucket landing-pages
create policy "Permitir acesso público para visualização de arquivos"
  on storage.objects for select
  using ( bucket_id = 'landing-pages' );

create policy "Permitir upload de arquivos para usuários autenticados"
  on storage.objects for insert
  with check ( bucket_id = 'landing-pages' AND auth.role() = 'authenticated' );

create policy "Permitir atualização de arquivos para usuários autenticados"
  on storage.objects for update
  using ( bucket_id = 'landing-pages' AND auth.role() = 'authenticated' );

create policy "Permitir deleção de arquivos para usuários autenticados"
  on storage.objects for delete
  using ( bucket_id = 'landing-pages' AND auth.role() = 'authenticated' ); 