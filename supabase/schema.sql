-- Habilita a extensão uuid-ossp para geração de UUIDs
create extension if not exists "uuid-ossp";

-- Configurações de segurança
alter default privileges revoke execute on functions from public;

-- Tabela de usuários
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('ADMIN', 'USER')) default 'USER',
  is_approved boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de landing pages
create table public.landing_pages (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  analytics_id text,
  meta_pixel_id text,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de leads
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  name text not null,
  phone text,
  custom_fields jsonb,
  page_id uuid references public.landing_pages(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Função para atualizar o updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Triggers para atualizar updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_landing_pages_updated_at
  before update on public.landing_pages
  for each row
  execute function public.handle_updated_at();

-- Função para criar um novo usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'USER');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar usuário automaticamente após signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Políticas de segurança RLS (Row Level Security)

-- Habilita RLS
alter table public.users enable row level security;
alter table public.landing_pages enable row level security;
alter table public.leads enable row level security;

-- Políticas para users
create policy "Usuários podem ver seu próprio perfil"
  on public.users for select
  using (auth.uid() = id);

create policy "Admins podem ver todos os usuários"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Admins podem atualizar usuários"
  on public.users for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

-- Políticas para landing_pages
create policy "Usuários podem ver suas próprias landing pages"
  on public.landing_pages for select
  using (auth.uid() = user_id);

create policy "Admins podem ver todas as landing pages"
  on public.landing_pages for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Usuários podem criar landing pages"
  on public.landing_pages for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias landing pages"
  on public.landing_pages for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias landing pages"
  on public.landing_pages for delete
  using (auth.uid() = user_id);

-- Políticas para leads
create policy "Usuários podem ver leads de suas landing pages"
  on public.leads for select
  using (
    exists (
      select 1 from public.landing_pages
      where landing_pages.id = leads.page_id
      and landing_pages.user_id = auth.uid()
    )
  );

create policy "Admins podem ver todos os leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Qualquer pessoa pode criar leads"
  on public.leads for insert
  with check (true);

-- Funções auxiliares
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where users.id = auth.uid()
    and users.role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Índices para melhor performance
create index if not exists users_email_idx on public.users (email);
create index if not exists landing_pages_slug_idx on public.landing_pages (slug);
create index if not exists landing_pages_user_id_idx on public.landing_pages (user_id);
create index if not exists leads_page_id_idx on public.leads (page_id);
create index if not exists leads_email_idx on public.leads (email); 