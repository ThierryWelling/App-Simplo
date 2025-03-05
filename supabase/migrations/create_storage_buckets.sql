-- Criar buckets de armazenamento
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir acesso público aos arquivos
CREATE POLICY "Arquivos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('avatars', 'app-assets') );

-- Apenas usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id IN ('avatars', 'app-assets') 
  AND auth.role() = 'authenticated'
);

-- Usuários só podem atualizar seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('avatars', 'app-assets')
  AND auth.uid() = owner
);

-- Usuários só podem deletar seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('avatars', 'app-assets')
  AND auth.uid() = owner
); 