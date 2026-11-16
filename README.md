# NutriEscola

Aplicação de cardápio escolar com interface HTML/CSS/JavaScript, API REST em Node.js e Express, e persistência PostgreSQL.

## Requisitos

- Node.js 20.19 ou superior
- pnpm 10
- Docker Compose (ou PostgreSQL 16 instalado)

## Configuração local no Windows

1. Inicie o PostgreSQL:

   ```powershell
   docker compose up -d db
   ```

2. Crie a configuração local da API e defina um segredo JWT:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Edite `backend\.env` e substitua `JWT_SECRET` por um segredo aleatório com pelo menos 32 caracteres.

3. Configure e preencha as tabelas de demonstração:

   ```powershell
   Set-Location backend
   npm.cmd install
   npm.cmd run db:setup
   ```

4. Crie a conta administradora. Use uma senha com pelo menos 12 caracteres:

   ```powershell
   $env:ADMIN_NAME = "Administrador"
   $env:ADMIN_EMAIL = "admin@escola.gov.br"
   $env:ADMIN_PASSWORD = "defina-uma-senha-forte"
   npm.cmd run admin:create
   Remove-Item Env:\ADMIN_NAME, Env:\ADMIN_EMAIL, Env:\ADMIN_PASSWORD
   ```

5. Inicie a API em um terminal:

   ```powershell
   npm.cmd run dev
   ```

6. Em outro terminal, a partir da raiz do projeto, entre na pasta do frontend, instale as dependências e inicie o Vite:

   ```powershell
   Set-Location frontend
   corepack.cmd pnpm install --frozen-lockfile
   corepack.cmd pnpm dev
   ```

   Abra a URL mostrada pelo Vite (por padrão `http://localhost:8443`). O Vite encaminha `/api` para o backend em `http://127.0.0.1:3000`.

## Rotas principais

- `POST /api/auth/register` e `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dishes` e `GET /api/dishes/:id`
- `POST /api/dishes`, `PUT /api/dishes/:id` e `DELETE /api/dishes/:id`
- `GET /api/menu?weekStart=AAAA-MM-DD` (a segunda-feira da semana)
- `PUT /api/menu/:date` com `{ "dishIds": ["uuid"] }`
- `GET /api/health`

As rotas de leitura exigem token Bearer. Alterações de pratos e cardápio exigem conta com papel `administrador`. O cadastro público não permite criar esse papel; use o comando `admin:create`.

As credenciais e o segredo do arquivo `backend\.env` são apenas para desenvolvimento local e não devem ser publicados.
