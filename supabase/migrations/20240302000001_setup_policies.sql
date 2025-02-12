-- Habilita RLS para todas as tabelas
alter table public.users enable row level security;
alter table public.landing_pages enable row level security;
alter table public.leads enable row level security;

-- Cria funções auxiliares
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'USER');
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role from public.users where id = auth.uid();
  return user_role = 'ADMIN';
end;
$$ language plpgsql security definer;

-- Cria triggers
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_landing_pages_updated_at
  before update on public.landing_pages
  for each row
  execute function public.handle_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Políticas para users
create policy "acesso_geral_usuarios"
  on public.users for select
  using (true);

create policy "usuarios_atualizam_proprio_perfil"
  on public.users for update
  using (auth.uid() = id or (select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "permitir_criacao_usuario"
  on public.users for insert
  with check (true);

-- Políticas para landing_pages
create policy "Usuários podem ver suas próprias landing pages"
  on public.landing_pages for select
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "Usuários podem criar landing pages"
  on public.landing_pages for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias landing pages"
  on public.landing_pages for update
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

create policy "Usuários podem deletar suas próprias landing pages"
  on public.landing_pages for delete
  using (auth.uid() = user_id or (select role from public.users where id = auth.uid()) = 'ADMIN');

-- Políticas para leads
create policy "Usuários podem ver leads de suas landing pages"
  on public.leads for select
  using (
    exists (
      select 1 from public.landing_pages
      where landing_pages.id = leads.page_id
      and (landing_pages.user_id = auth.uid() or (select role from public.users where id = auth.uid()) = 'ADMIN')
    )
  );

create policy "Qualquer pessoa pode criar leads"
  on public.leads for insert
  with check (true);

-- Configuração do Storage
insert into storage.buckets (id, name, public)
values ('landing-pages', 'landing-pages', true)
on conflict (id) do nothing;

-- Políticas para storage
create policy "storage_public_read"
  on storage.objects for select
  using (bucket_id = 'landing-pages');

create policy "storage_authenticated_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'landing-pages'
    and auth.role() = 'authenticated'
  );

create policy "storage_authenticated_update"
  on storage.objects for update
  using (
    bucket_id = 'landing-pages'
    and auth.role() = 'authenticated'
  );

create policy "storage_authenticated_delete"
  on storage.objects for delete
  using (
    bucket_id = 'landing-pages'
    and auth.role() = 'authenticated'
  );

-- Configurações de performance
alter table public.users set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- Permissões
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;
grant all on public.landing_pages to authenticated;
grant select on public.landing_pages to anon;
grant all on public.leads to authenticated;
grant insert on public.leads to anon;

grant all on storage.buckets to postgres, anon, authenticated, service_role;
grant all on storage.objects to postgres, anon, authenticated, service_role;

-- Índices para melhor performance
create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx on public.users (role);
create index if not exists landing_pages_slug_idx on public.landing_pages (slug);
create index if not exists landing_pages_user_id_idx on public.landing_pages (user_id);
create index if not exists leads_page_id_idx on public.leads (page_id);
create index if not exists leads_email_idx on public.leads (email); 