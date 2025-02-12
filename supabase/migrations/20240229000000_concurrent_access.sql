-- Remove políticas existentes
drop policy if exists "Permitir leitura do próprio perfil" on public.users;
drop policy if exists "Permitir atualização do próprio perfil" on public.users;
drop policy if exists "Permitir inserção de novos usuários" on public.users;

-- Cria novas políticas mais permissivas
create policy "acesso_leitura_usuarios"
  on public.users for select
  using (true);  -- Permite leitura para todos os usuários autenticados

create policy "acesso_atualizacao_usuarios"
  on public.users for update
  using (
    auth.uid() = id 
    or exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'ADMIN'
    )
  );

create policy "acesso_insercao_usuarios"
  on public.users for insert
  with check (true);  -- Permite inserção para todos os usuários

-- Ajusta as permissões da tabela
alter table public.users enable row level security;

-- Garante permissões para usuários anônimos e autenticados
grant usage on schema public to anon, authenticated;
grant all on public.users to anon, authenticated;

-- Aumenta os limites de conexão e taxa de requisição
alter role authenticated set statement_timeout = '30s';
alter role anon set statement_timeout = '30s';

-- Adiciona índices para melhorar performance em acessos concorrentes
create index if not exists users_auth_id_idx on public.users(id);
create index if not exists users_role_idx on public.users(role);

-- Otimiza a tabela para melhor performance em acessos concorrentes
alter table public.users set (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
); 