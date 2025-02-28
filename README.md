# Simplo Landing Pages

Plataforma web full-stack para gerenciamento e criação de landing pages, focada na captura de leads para transmissões ao vivo no YouTube.

## Funcionalidades

- Dashboard administrativo
- Autenticação segura com Supabase
- Gestão de imagens
- Criação de formulários personalizados
- Integração com Google Analytics
- Integração com Meta Pixel
- Controle total de usuários e configurações

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Supabase (Banco de dados e Autenticação)
- TailwindCSS
- Shadcn/ui

## Como executar

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env.local`
- Preencha as variáveis com suas credenciais do Supabase

4. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

5. Acesse http://localhost:3000

## Estrutura do Projeto

```
src/
  ├── app/              # Rotas e páginas
  ├── components/       # Componentes reutilizáveis
  ├── lib/             # Configurações e utilitários
  ├── hooks/           # Custom hooks
  ├── types/           # Definições de tipos
  └── utils/           # Funções utilitárias
```

## Contribuindo

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 