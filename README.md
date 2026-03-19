# FacturaPro (React + Node.js)

App de gestión de facturas con diseño dashboard (frontend) y backend Node.js.

## Estructura

- `client/`: React + Vite (UI dashboard)
- `server/`: Node.js (Express) + Prisma + PostgreSQL

## Requisitos

- Node.js 18+
- Docker Desktop (opcional, para levantar PostgreSQL rápido)

## Ejecutar (Windows PowerShell)

### 1) Instalar dependencias

```powershell
cd c:\Users\asegundo\Desktop\calculadorapro
npm install
```

### 2) Base de datos (PostgreSQL)

Opción A (recomendada): con Docker

```powershell
docker compose up -d
```

Opción B: PostgreSQL local

Configura tu `DATABASE_URL` en `server/.env` (puedes copiar `server/.env.example`).

### 3) Migraciones + seed

```powershell
Copy-Item server\.env.example server\.env
npm run db:migrate
npm run db:seed
```

### 4) Levantar backend

```powershell
npm run dev:server
```

Backend: `http://localhost:4000/health`

### 5) Levantar frontend

```powershell
npm run dev:client
```

Frontend: `http://localhost:5173/`

## Usuarios demo (seed)

- Admin (ve todo): `admin@facturapro.test` / `Admin1234!`
- Usuario: `user@facturapro.test` / `User1234!`

