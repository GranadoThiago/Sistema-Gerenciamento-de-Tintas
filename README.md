# Sistema de Manipulação de Tintas — Vercel + Postgres

Este projeto substitui o armazenamento local (IndexedDB) por um banco de
dados Postgres na Vercel, e adiciona tela de login com usuários e permissões
(`admin` / `comum`).

## Estrutura

```
├── index.html          → tela principal do sistema (protegida por login)
├── login.html           → tela de login
├── usuarios.html         → gestão de usuários (somente admin)
├── api/
│   ├── setup.js          → endpoint único para criar as tabelas + admin inicial
│   ├── auth/
│   │   ├── login.js
│   │   ├── logout.js
│   │   └── me.js
│   ├── users/
│   │   ├── index.js      → listar (GET) / criar (POST) usuários
│   │   └── [id].js       → editar (PUT) / excluir (DELETE) um usuário
│   ├── manipulacoes/
│   │   ├── index.js      → listar (GET, com busca ?q=) / criar (POST)
│   │   └── [id].js       → ler, editar, excluir uma manipulação
│   └── _lib/
│       ├── db.js         → conexão com Postgres
│       └── auth.js       → hash de senha, JWT, cookies de sessão
└── package.json
```

## Passo a passo do deploy

### 1. Suba o projeto para o GitHub (ou envie direto pela CLI da Vercel)

Crie um repositório com estes arquivos e importe-o em https://vercel.com/new,
ou rode `vercel` na pasta do projeto (com a Vercel CLI instalada).

### 2. Adicione um banco de dados Postgres

No painel do projeto na Vercel: **Storage → Create Database → Postgres**
(é o Neon por baixo dos panos). Ao conectar ao projeto, a Vercel cria
automaticamente a variável de ambiente `POSTGRES_URL` (e variações) — você
não precisa copiar nada manualmente.

### 3. Configure as variáveis de ambiente

Em **Settings → Environment Variables**, adicione:

| Nome | Valor | Observação |
|---|---|---|
| `JWT_SECRET` | uma string aleatória e longa | usada para assinar os logins. Gere uma com `openssl rand -hex 32` |
| `SETUP_SECRET` | outra string aleatória | protege o endpoint `/api/setup`, que cria as tabelas |

Depois de adicionar, faça um novo deploy (ou "Redeploy") para que as
variáveis entrem em vigor.

### 4. Rode a configuração inicial (uma única vez)

Depois do primeiro deploy, chame o endpoint de setup para criar as tabelas
e o seu usuário administrador. Pode ser pelo terminal:

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "O_MESMO_VALOR_DE_SETUP_SECRET",
    "nome": "Seu Nome",
    "email": "voce@email.com",
    "senha": "uma-senha-forte"
  }'
```

Isso cria as tabelas `usuarios` e `manipulacoes` e o seu usuário com
permissão de administrador.

> Depois de rodar uma vez, você pode remover a variável `SETUP_SECRET` ou
> trocá-la, já que o endpoint não precisa mais ser usado (a menos que você
> queira recriar o admin).

### 5. Acesse o sistema

Vá até `https://SEU-PROJETO.vercel.app/login.html`, entre com o email e
senha cadastrados, e você estará no sistema. Como administrador, você verá
o botão **👤 Usuários** para cadastrar os demais usuários (comuns ou
administradores) pela própria interface — não precisa mais usar o endpoint
de setup para isso.

## Permissões

- **Usuário comum**: acessa o sistema normalmente (cadastrar, editar,
  excluir e exportar manipulações).
- **Administrador**: tudo isso, mais acesso à tela de gestão de usuários
  (`/usuarios.html`) para criar, editar permissão, redefinir senha e excluir
  outros usuários.

Se quiser restringir também as manipulações (por exemplo, usuário comum só
vê o que ele mesmo cadastrou), me avise — hoje todos os usuários logados
enxergam todos os registros, só a gestão de usuários é exclusiva de admin.

## Observações técnicas

- Sessão de login usa cookie `httpOnly` com um JWT válido por 7 dias — não
  fica nada sensível acessível via JavaScript no navegador.
- Senhas são armazenadas com hash `bcrypt`, nunca em texto puro.
- Local dev: rode `vercel dev` na raiz do projeto (requer `vercel login` e
  as mesmas variáveis de ambiente configuradas localmente em `.env`).
