-- Recria a tabela templates
drop table if exists public.templates cascade;

create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  description text,
  colors jsonb default '{"primary":"#3b82f6","secondary":"#8b5cf6","background":"#1e1e1e","text":"#ffffff"}'::jsonb,
  gradients jsonb default '[]'::jsonb,
  fonts jsonb default '{"heading":"Inter","body":"Inter"}'::jsonb,
  form_position text default 'right',
  form_style jsonb default '{"borderRadius":"0.5rem","backgroundColor":"rgba(0,0,0,0.5)","inputStyle":"modern","buttonStyle":"gradient"}'::jsonb,
  layout_type text not null default 'default',
  max_width text default 'full',
  spacing jsonb default '{"py":"8","px":"8","gap":"8"}'::jsonb,
  effects jsonb default '{"glassmorphism":false,"animation":false,"parallax":false}'::jsonb,
  seo jsonb default '{"title":"","description":"","keywords":""}'::jsonb,
  widgets jsonb default '[]'::jsonb,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Atualiza a tabela landing_pages com os campos do template
alter table public.landing_pages
add column if not exists template_id uuid references public.templates(id) on delete set null,
add column if not exists colors jsonb default '{"primary":"#3b82f6","secondary":"#8b5cf6","background":"#1e1e1e","text":"#ffffff"}'::jsonb,
add column if not exists gradients jsonb default '[]'::jsonb,
add column if not exists fonts jsonb default '{"heading":"Inter","body":"Inter"}'::jsonb,
add column if not exists form_position text default 'right',
add column if not exists form_style jsonb default '{"borderRadius":"0.5rem","backgroundColor":"rgba(0,0,0,0.5)","inputStyle":"modern","buttonStyle":"gradient"}'::jsonb,
add column if not exists layout_type text default 'default',
add column if not exists max_width text default 'full',
add column if not exists spacing jsonb default '{"py":"8","px":"8","gap":"8"}'::jsonb,
add column if not exists effects jsonb default '{"glassmorphism":false,"animation":false,"parallax":false}'::jsonb,
add column if not exists seo jsonb default '{"title":"","description":"","keywords":""}'::jsonb,
add column if not exists widgets jsonb default '[]'::jsonb;

-- Função para aplicar configurações do template
create or replace function public.apply_template_config()
returns trigger as $$
begin
  if new.template_id is not null then
    select 
      colors, gradients, fonts, form_position, form_style,
      layout_type, max_width, spacing, effects, seo, widgets
    into 
      new.colors, new.gradients, new.fonts, new.form_position, new.form_style,
      new.layout_type, new.max_width, new.spacing, new.effects, new.seo, new.widgets
    from public.templates
    where id = new.template_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Remove triggers existentes se necessário
drop trigger if exists apply_template_config on public.landing_pages;
drop trigger if exists handle_templates_updated_at on public.templates;

-- Cria os triggers
do $$
begin
  -- Trigger para aplicar configurações do template
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'apply_template_config' 
    and tgrelid = 'public.landing_pages'::regclass
  ) then
    create trigger apply_template_config
      before insert or update of template_id on public.landing_pages
      for each row
      execute function public.apply_template_config();
  end if;

  -- Trigger para atualizar updated_at
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'handle_templates_updated_at' 
    and tgrelid = 'public.templates'::regclass
  ) then
    create trigger handle_templates_updated_at
      before update on public.templates
      for each row
      execute function public.handle_updated_at();
  end if;
end$$;

-- Garante permissões
grant usage on schema public to anon, authenticated;
grant all privileges on public.templates to authenticated;
grant select on public.templates to anon;
grant usage, select on all sequences in schema public to authenticated;

-- Habilita RLS
alter table public.templates enable row level security;

-- Remove políticas existentes
drop policy if exists templates_select on public.templates;
drop policy if exists templates_insert on public.templates;
drop policy if exists templates_update on public.templates;
drop policy if exists templates_delete on public.templates;

-- Cria novas políticas
create policy templates_select
  on public.templates for select
  using (true);

create policy templates_insert
  on public.templates for insert
  with check (auth.role() = 'authenticated');

create policy templates_update
  on public.templates for update
  using (auth.uid() = user_id);

create policy templates_delete
  on public.templates for delete
  using (auth.uid() = user_id);

-- Cria bucket para templates se não existir
insert into storage.buckets (id, name, public)
select 'templates', 'templates', true
where not exists (
  select 1 from storage.buckets where id = 'templates'
);

-- Garante que as políticas de storage para templates existam
do $$
begin
  -- Remove políticas antigas se existirem
  drop policy if exists "templates_public_read" on storage.objects;
  drop policy if exists "templates_authenticated_insert" on storage.objects;
  drop policy if exists "templates_authenticated_update" on storage.objects;
  drop policy if exists "templates_authenticated_delete" on storage.objects;
  
  -- Cria as políticas apenas se não existirem
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'templates_public_read'
  ) then
    create policy "templates_public_read"
      on storage.objects for select
      using (bucket_id = 'templates');
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'templates_authenticated_insert'
  ) then
    create policy "templates_authenticated_insert"
      on storage.objects for insert
      with check (
        bucket_id = 'templates'
        and auth.role() = 'authenticated'
      );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'templates_authenticated_update'
  ) then
    create policy "templates_authenticated_update"
      on storage.objects for update
      using (
        bucket_id = 'templates'
        and auth.role() = 'authenticated'
      );
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'templates_authenticated_delete'
  ) then
    create policy "templates_authenticated_delete"
      on storage.objects for delete
      using (
        bucket_id = 'templates'
        and auth.role() = 'authenticated'
      );
  end if;
end$$;

-- Índices
create index if not exists templates_user_id_idx on public.templates (user_id);
create index if not exists templates_slug_idx on public.templates (slug);

-- Garante permissões para a tabela templates
grant usage on schema public to authenticated;
grant all on public.templates to authenticated;
grant select on public.templates to anon;

-- Garante permissões para a sequência do id
grant usage, select on all sequences in schema public to authenticated; 