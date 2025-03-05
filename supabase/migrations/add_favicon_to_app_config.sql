-- Adicionar coluna favicon_url na tabela app_config
ALTER TABLE public.app_config
ADD COLUMN IF NOT EXISTS favicon_url TEXT; 