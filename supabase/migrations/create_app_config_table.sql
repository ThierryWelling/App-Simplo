-- Habilitar a extensão uuid-ossp se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de configurações do aplicativo
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT NOT NULL DEFAULT 'Simplo Pages',
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#0066FF',
    notify_on_lead BOOLEAN NOT NULL DEFAULT TRUE,
    admin_email TEXT NOT NULL DEFAULT '',
    whatsapp_number TEXT,
    whatsapp_message TEXT,
    integration_api_key UUID DEFAULT uuid_generate_v4(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar políticas de acesso
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Apenas usuários autenticados podem acessar as configurações
CREATE POLICY "Usuários autenticados podem ler as configurações" 
ON public.app_config 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Apenas usuários autenticados podem criar e atualizar as configurações
CREATE POLICY "Usuários autenticados podem atualizar as configurações" 
ON public.app_config 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir as configurações" 
ON public.app_config 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_app_config_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração padrão se não existir
INSERT INTO public.app_config (site_name, primary_color, notify_on_lead, admin_email, is_active)
SELECT 'Simplo Pages', '#0066FF', TRUE, '', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.app_config WHERE is_active = TRUE); 