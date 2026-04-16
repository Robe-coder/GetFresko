# GetFresko — CLAUDE.md
> Leer completo antes de escribir cualquier código. Se actualiza automáticamente cada sesión.

---

## Contexto del proyecto

GetFresko es una PWA mobile-first de gestión inteligente de despensa:
- Reduce desperdicio alimentario con alertas de caducidad
- Usa IA (OpenRouter → Anthropic) para recetas y OCR de tickets
- Gamifica el consumo responsable (FreskoPoints, rachas, badges)
- Monetización vía Stripe (Free / Premium 2.99€/mes / Familia 4.99€/mes)

**No es un simple gestor de despensa. Es un asistente doméstico inteligente.**

---

## Stack y herramientas

- **Next.js 14+** App Router + Server Actions
- **Tailwind CSS** (mobile-first)
- **TanStack Query** (server state)
- **Zod** (validación, schemas)
- **Supabase** (PostgreSQL + RLS + Auth + Storage)
- **OpenRouter** → modelos Anthropic (compatible con `@anthropic-ai/sdk`)
- **Stripe** (pagos + webhooks)
- **Vercel** (deploy)
- **pnpm** (package manager)

## Rutas importantes del repo

| Archivo | Qué contiene |
|---------|-------------|
| `src/types/index.ts` | Todos los tipos TypeScript globales |
| `src/lib/validations.ts` | Schemas Zod |
| `src/lib/ai.ts` | Cliente OpenRouter + modelos + prompts |
| `src/lib/supabase/` | Clientes Supabase (client / server / middleware) |
| `src/middleware.ts` | Auth guard + premium guard |
| `supabase/schema.sql` | Schema SQL completo + seed |
| `docs/PROBLEMS.md` | Registro de problemas y soluciones |
| `docs/ROADMAP.md` | Roadmap del MVP |
| `docs/ARCHITECTURE.md` | Decisiones de arquitectura |
| `.env.local.example` | Variables de entorno necesarias |

---

## Reglas de desarrollo (no negociables)

1. **Tipos primero** — `src/types/index.ts` y `src/lib/validations.ts` deben estar actualizados antes de cualquier componente.
2. **RLS siempre activo** — nunca usar `service_role` en el cliente. Solo en Server Actions o webhooks.
3. **Server Actions para mutaciones** — no API Routes para operaciones de usuario.
4. **No Edge Functions** — toda lógica en Next.js Server Actions.
5. **AI via `aiClient`** — nunca strings hardcodeados de modelos; usar `AI_MODELS.recipes` o `AI_MODELS.ocr`.
6. **Caché de recetas** — antes de llamar a la IA, buscar en `recipes_cache` por hash SHA-256.
7. **Middleware Stripe listo** — aunque no esté activo, el guard de premium existe y está comentado hasta semana 4.
8. **Documentar problemas** — cualquier problema no trivial va a `docs/PROBLEMS.md`.
9. **Commits y push automáticos** — hacer commit y push al final de cada sesión de trabajo sin que el usuario lo pida.
10. **pnpm siempre** — nunca npm o yarn.

---

## Variables de entorno necesarias

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

Configuradas en `.env.local` (no commitear). Ver `.env.local.example`.

---

## Modelo de negocio — límites de plan

| Feature | Free | Premium (2.99€/mes) | Familia (4.99€/mes) |
|---------|------|---------------------|---------------------|
| Productos activos | 20 | Ilimitados | Ilimitados |
| Recetas/semana | 3 | Ilimitadas | Ilimitadas |
| Escaneos ticket/semana | 1 | Ilimitados | Ilimitados |
| Usuarios | 1 | 1 (hasta 3) | Hasta 5 |

---

## Gamificación — puntos

| Acción | Puntos |
|--------|--------|
| Añadir producto | +2 |
| Consumir antes de caducar | +10 |
| Consumir el día de caducidad | +5 |
| Desperdiciar | -5 |
| Escanear ticket | +8 |
| Usar receta | +5 |
| Racha 7 días | +50 bonus |
| Racha 30 días | +200 bonus |

---

## Estrategia de plataforma

**Orden de lanzamiento decidido por el usuario:**
1. **PWA** (Progressive Web App) — primera prioridad, instalable en iOS/Android desde el navegador
2. **Web** — misma codebase, responsive
3. **Native app** (Capacitor) — Post-MVP, solo si PWA valida el producto

La PWA usa Next.js + `@ducanh2912/next-pwa` (service worker, manifest, push notifications).
Push notifications son clave para alertas de caducidad.

---

## Estado del proyecto

### Hecho
- [x] Scaffold Next.js + dependencias instaladas
- [x] Estructura de carpetas creada
- [x] Tipos TypeScript globales (`src/types/index.ts`)
- [x] Schemas Zod (`src/lib/validations.ts`)
- [x] Clientes Supabase (client / server / middleware)
- [x] Cliente AI OpenRouter (`src/lib/ai.ts`)
- [x] Middleware auth + premium guard
- [x] Schema SQL completo con RLS y seed
- [x] Documentación inicial
- [x] Repo GitHub creado y pusheado
- [x] `.env.local` configurado (Supabase + OpenRouter + Stripe)

### Pendiente
- [x] PWA config (manifest + service worker — `@ducanh2912/next-pwa`)
- [x] Auth UI (login + registro + Google OAuth + callback /auth/callback)
- [x] Layout shell mobile-first (Header, BottomNav, AppShell)
- [x] CRUD productos
- [x] Dashboard con alertas de caducidad
- [x] Gamificación (FreskoPoints + rachas + badges)
- [x] Generador de recetas con caché SHA-256
- [x] OCR de tickets
- [ ] Stripe (checkout + webhooks + guards premium)
- [ ] Deploy Vercel

---

## IMPORTANTE — Ruta del proyecto

El proyecto vive en **`D:\GetFresko`**. Existe una carpeta vacía en `C:\Users\user\GetFresko` que hay que ignorar.

- Claude Code debe abrirse desde `D:\GetFresko`
- VSCode: `File → Open Folder → D:\GetFresko`
- pnpm store configurado en `D:\.pnpm-store` (C: está lleno)
- Al instalar paquetes usar siempre: `TEMP="/d/tmp" TMP="/d/tmp" TMPDIR="/d/tmp" pnpm add ...`

---

## GitHub

- **Repo:** github.com/Robe-coder/GetFresko
- **Branch principal:** main
- **Convención de commits:** `tipo: descripción corta` (feat, fix, docs, chore, refactor)
- **Política:** commit + push al final de cada sesión de trabajo
- **Documentación:** actualizar CLAUDE.md, PROBLEMS.md y ROADMAP.md al final de cada sesión sin que el usuario lo pida

---

## Contexto de sesiones anteriores

### Sesión 3 — 2026-04-16
- Generador de recetas IA completo con caché SHA-256 (`src/app/(app)/recetas/` + `src/lib/actions/recipes.ts`)
- OCR de tickets con visión claude-haiku-4-5 (`src/app/(app)/productos/escanear/` + `src/lib/actions/tickets.ts`)
- Estadísticas reales: FreskoPoints, rachas, badges, tasa de ahorro, barra de progreso (`src/app/(app)/estadisticas/`)
- Funciones SQL añadidas al schema: `add_freskopoints`, `update_streak`, tabla `user_badges`
- Streak update integrado en `updateProductStatus` action
- **Próxima sesión:** Stripe integration (checkout + webhooks), deploy Vercel

### Sesión 2 — 2026-04-13
- PWA config + service worker (@ducanh2912/next-pwa)
- Auth UI completa (login + registro + Google OAuth + /auth/callback)
- Layout shell mobile-first (Header, BottomNav, AppShell)
- CRUD productos (Server Actions + ProductCard con swipe actions)
- Dashboard con alertas de caducidad y acciones rápidas
- Proxy/middleware para auth guard (Next.js 16: middleware.ts → proxy.ts)

### Sesión 1 — 2026-04-07 / 2026-04-08
- Setup completo del proyecto en `D:\GetFresko`
- C: lleno → pnpm store movido a `D:\.pnpm-store`; instalar paquetes con `TEMP="/d/tmp" pnpm add ...`
- `create-next-app` rechaza nombres con mayúsculas → scaffold en /tmp y mover a D:
- Dependencias instaladas: supabase, tanstack-query, zod, anthropic sdk, stripe, clsx, tailwind-merge
- VSCode tenía abierta `C:\Users\user\GetFresko` (vacía) → abrir siempre `D:\GetFresko`
- Supabase: proyecto creado, pendiente de pasar credenciales para crear `.env.local`
- GitHub: repo pendiente de crear (necesita `gh auth login`)
- **Próxima sesión:** pasar credenciales Supabase + hacer gh auth + construir todo (auth UI, layout, CRUD, IA, Stripe)
- Ver `docs/PROBLEMS.md` para detalles completos
