-- Remove políticas existentes
drop policy if exists "Usuários podem ver seu próprio perfil" on public.users;
drop policy if exists "Admins podem ver todos os usuários" on public.users;
drop policy if exists "Admins podem atualizar usuários" on public.users;
drop policy if exists "users_read_policy" on public.users;
drop policy if exists "users_update_policy" on public.users;
drop policy if exists "users_insert_policy" on public.users;

-- Cria novas políticas mais permissivas para a tabela users
create policy "Permitir leitura do próprio perfil"
  on public.users for select
  using (
    auth.uid() = id 
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Permitir atualização do próprio perfil"
  on public.users for update
  using (
    auth.uid() = id 
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "Permitir inserção de novos usuários"
  on public.users for insert
  with check (true);

-- Garante que a RLS está habilitada
alter table public.users enable row level security;

-- Garante que o papel anon pode usar a tabela users
grant usage on schema public to anon;
grant select on public.users to anon;
grant insert on public.users to anon;
grant update on public.users to anon;

-- Garante que o papel authenticated pode usar a tabela users
grant usage on schema public to authenticated;
grant all on public.users to authenticated; 