# Luis.pp

Área pessoal para organizar trabalhos acadêmicos por disciplina, pesquisar arquivos e acessar materiais de qualquer computador.

## Tecnologias
- React + Vite
- Supabase (banco de dados e armazenamento)
- Deploy previsto na Vercel

## Rodar localmente
1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env` e configure as variáveis do Supabase.
4. Execute `npm run dev`.

## Configuração do Supabase
Execute `supabase/schema.sql` no SQL Editor do Supabase e crie um bucket privado chamado `academic-files`.

**Importante:** este repositório é a base inicial do projeto. Antes de guardar documentos pessoais, é necessário concluir a autenticação segura com PIN, controle de tentativas, políticas RLS e autorização do armazenamento. Não use um PIN local demonstrativo como proteção real.