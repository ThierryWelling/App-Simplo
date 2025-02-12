-- Desativa RLS para todas as tabelas
alter table public.users disable row level security;
alter table public.landing_pages disable row level security;
alter table public.leads disable row level security;

-- Remove todas as políticas da tabela users
drop policy if exists "Usuários podem ver seu próprio perfil" on public.users;
drop policy if exists "Admins podem ver todos os usuários" on public.users;
drop policy if exists "Admins podem atualizar usuários" on public.users;
drop policy if exists "users_read_policy" on public.users;
drop policy if exists "users_update_policy" on public.users;
drop policy if exists "users_insert_policy" on public.users;
drop policy if exists "Permitir leitura do próprio perfil" on public.users;
drop policy if exists "Permitir atualização do próprio perfil" on public.users;
drop policy if exists "Permitir inserção de novos usuários" on public.users;
drop policy if exists "acesso_leitura_usuarios" on public.users;
drop policy if exists "acesso_atualizacao_usuarios" on public.users;
drop policy if exists "acesso_insercao_usuarios" on public.users;

-- Remove todas as políticas da tabela landing_pages
drop policy if exists "Usuários podem ver suas próprias landing pages" on public.landing_pages;
drop policy if exists "Admins podem ver todas as landing pages" on public.landing_pages;
drop policy if exists "Usuários podem criar landing pages" on public.landing_pages;
drop policy if exists "Usuários podem atualizar suas próprias landing pages" on public.landing_pages;
drop policy if exists "Usuários podem deletar suas próprias landing pages" on public.landing_pages;

-- Remove todas as políticas da tabela leads
drop policy if exists "Usuários podem ver leads de suas landing pages" on public.leads;
drop policy if exists "Admins podem ver todos os leads" on public.leads;
drop policy if exists "Qualquer pessoa pode criar leads" on public.leads;

-- Remove todas as políticas de storage
drop policy if exists "Permitir upload de imagens" on storage.objects;
drop policy if exists "Permitir acesso público às imagens" on storage.objects;
drop policy if exists "Permitir delete de imagens" on storage.objects;
drop policy if exists "storage_public_read" on storage.objects;
drop policy if exists "storage_authenticated_insert" on storage.objects;
drop policy if exists "storage_authenticated_update" on storage.objects;
drop policy if exists "storage_authenticated_delete" on storage.objects;

-- Remove funções auxiliares
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;

-- Remove triggers
drop trigger if exists handle_users_updated_at on public.users;
drop trigger if exists handle_landing_pages_updated_at on public.landing_pages;
drop trigger if exists on_auth_user_created on auth.users;

-- Revoga todas as permissões
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;
revoke all on all functions in schema public from anon;
revoke all on all functions in schema public from authenticated;

revoke all on storage.buckets from anon;
revoke all on storage.buckets from authenticated;
revoke all on storage.objects from anon;
revoke all on storage.objects from authenticated;

-- Remove o bucket de storage e seus objetos
drop policy if exists "Permitir acesso público ao bucket" on storage.buckets;
-- Primeiro remove todos os objetos do bucket
delete from storage.objects where bucket_id = 'landing-pages';
-- Depois remove o bucket
delete from storage.buckets where id = 'landing-pages';

-- Reseta as configurações de autovacuum
alter table public.users reset (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);

-- Remove índices
drop index if exists users_email_idx;
drop index if exists landing_pages_slug_idx;
drop index if exists landing_pages_user_id_idx;
drop index if exists leads_page_id_idx;
drop index if exists leads_email_idx;
drop index if exists users_auth_id_idx;
drop index if exists users_role_idx; 