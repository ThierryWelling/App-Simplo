# Migrações do Supabase para Simplo Pages

Este diretório contém as migrações SQL para criar e atualizar o esquema do banco de dados do Supabase para o aplicativo Simplo Pages.

## Como aplicar as migrações

### 1. Usando o Console do Supabase

1. Faça login no [Console do Supabase](https://app.supabase.io/)
2. Selecione seu projeto
3. Vá para a seção **SQL Editor**
4. Crie uma nova consulta
5. Copie e cole o conteúdo dos arquivos de migração
6. Execute a consulta

### 2. Usando a CLI do Supabase (Recomendado)

Se você estiver usando a CLI do Supabase, pode aplicar essas migrações automaticamente:

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

## Estrutura do Banco de Dados

O aplicativo Simplo Pages utiliza as seguintes tabelas principais:

- **landing_pages**: Armazena todas as landing pages
- **leads**: Armazena os leads capturados pelos formulários
- **thank_you_pages**: Armazena as páginas de agradecimento
- **profiles**: Armazena os perfis dos usuários
- **app_config**: Armazena as configurações globais do aplicativo

## Políticas de Segurança

Todas as tabelas têm políticas de Row Level Security (RLS) ativadas, garantindo que:

- Apenas usuários autenticados podem ler registros
- Usuários só podem editar seus próprios registros
- Administradores têm acesso total

## Funções e Triggers

Foram implementadas várias funções e triggers para:

- Criar automaticamente perfis de usuário após o registro
- Atualizar timestamps de `updated_at` automaticamente
- Gerenciar relacionamentos entre tabelas 