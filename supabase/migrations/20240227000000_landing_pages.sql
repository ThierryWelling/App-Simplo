-- Cria a tabela landing_pages
create table public.landing_pages (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Atualiza a tabela landing_pages com os novos campos
alter table public.landing_pages
add column if not exists logo_url text,
add column if not exists background_url text,
add column if not exists template_id uuid references public.templates(id) on delete set null,
add column if not exists colors jsonb default '{"primary":"#3b82f6","secondary":"#8b5cf6","background":"#1e1e1e","text":"#ffffff"}'::jsonb,
add column if not exists gradients jsonb default '[]'::jsonb,
add column if not exists fonts jsonb default '{"heading":"Inter","body":"Inter"}'::jsonb,
add column if not exists form_type text not null default 'builder',
add column if not exists form_position text default 'right',
add column if not exists form_style jsonb default '{"borderRadius":"0.5rem","backgroundColor":"rgba(0,0,0,0.5)","inputStyle":"modern","buttonStyle":"gradient"}'::jsonb,
add column if not exists custom_html text,
add column if not exists form_fields jsonb,
add column if not exists layout_type text default 'default',
add column if not exists maxWidth text default 'full',
add column if not exists spacing jsonb default '{"py":"8","px":"8","gap":"8"}'::jsonb,
add column if not exists effects jsonb default '{"glassmorphism":false,"animation":false,"parallax":false}'::jsonb,
add column if not exists seo jsonb default '{"title":"","description":"","keywords":""}'::jsonb,
add column if not exists analytics jsonb default '{"googleAnalyticsId":"","metaPixelId":""}'::jsonb;

-- Função para aplicar configurações do template
create or replace function public.apply_template_config()
returns trigger as $$
begin
  if new.template_id is not null then
    select 
      colors, gradients, fonts, form_position, form_style,
      layout_type, maxWidth, spacing, effects, seo
    into 
      new.colors, new.gradients, new.fonts, new.form_position, new.form_style,
      new.layout_type, new.maxWidth, new.spacing, new.effects, new.seo
    from public.templates
    where id = new.template_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para atualizar updated_at
create trigger handle_landing_pages_updated_at
  before update on public.landing_pages
  for each row
  execute function public.handle_updated_at();

-- Trigger para aplicar configurações do template
create trigger apply_template_config
  before insert or update of template_id on public.landing_pages
  for each row
  execute function public.apply_template_config();

-- Remove políticas existentes para evitar conflitos
drop policy if exists "Usuários podem ver suas próprias landing pages" on public.landing_pages;
drop policy if exists "Admins podem ver todas as landing pages" on public.landing_pages;
drop policy if exists "Usuários podem criar landing pages" on public.landing_pages;
drop policy if exists "Usuários podem atualizar suas próprias landing pages" on public.landing_pages;
drop policy if exists "Usuários podem deletar suas próprias landing pages" on public.landing_pages;

-- Habilita RLS
alter table public.landing_pages enable row level security;

-- Cria novas políticas de segurança
create policy "landing_pages_select"
  on public.landing_pages for select
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "landing_pages_insert"
  on public.landing_pages for insert
  with check (auth.uid() = user_id);

create policy "landing_pages_update"
  on public.landing_pages for update
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "landing_pages_delete"
  on public.landing_pages for delete
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

-- Cria o bucket para armazenamento de imagens se não existir
insert into storage.buckets (id, name, public)
select 'landing-pages', 'landing-pages', true
where not exists (
  select 1 from storage.buckets where id = 'landing-pages'
);

-- Garante que as políticas de storage existam
do $$
begin
  -- Remove políticas antigas se existirem
  drop policy if exists "storage_public_read" on storage.objects;
  drop policy if exists "storage_authenticated_insert" on storage.objects;
  drop policy if exists "storage_authenticated_update" on storage.objects;
  drop policy if exists "storage_authenticated_delete" on storage.objects;
  
  -- Cria as políticas apenas se não existirem
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'storage_public_read'
  ) then
    create policy "storage_public_read"
      on storage.objects for select
      using (bucket_id = 'landing-pages');
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'storage_authenticated_insert'
  ) then
    create policy "storage_authenticated_insert"
      on storage.objects for insert
      with check (
        bucket_id = 'landing-pages'
        and auth.role() = 'authenticated'
      );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'storage_authenticated_update'
  ) then
    create policy "storage_authenticated_update"
      on storage.objects for update
      using (
        bucket_id = 'landing-pages'
        and auth.role() = 'authenticated'
      );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'storage_authenticated_delete'
  ) then
    create policy "storage_authenticated_delete"
      on storage.objects for delete
      using (
        bucket_id = 'landing-pages'
        and auth.role() = 'authenticated'
      );
  end if;
end$$;

-- Índices para melhor performance
create index if not exists landing_pages_user_id_idx on public.landing_pages (user_id);
create index if not exists landing_pages_slug_idx on public.landing_pages (slug);
create index if not exists landing_pages_template_id_idx on public.landing_pages (template_id); 