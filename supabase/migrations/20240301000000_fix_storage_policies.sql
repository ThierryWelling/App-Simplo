-- Garante que o bucket existe
insert into storage.buckets (id, name, public)
select 'landing-pages', 'landing-pages', true
where not exists (
  select 1 from storage.buckets where id = 'landing-pages'
);

-- Remove políticas existentes
drop policy if exists "Permitir upload de imagens" on storage.objects;
drop policy if exists "Permitir acesso público às imagens" on storage.objects;
drop policy if exists "Permitir delete de imagens" on storage.objects;

-- Cria novas políticas mais permissivas
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

-- Garante permissões para o bucket
grant all on storage.objects to postgres, anon, authenticated, service_role;
grant all on storage.buckets to postgres, anon, authenticated, service_role; 