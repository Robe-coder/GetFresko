# GetFresko — Decisiones de Arquitectura

## Stack

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Frontend | Next.js 14+ App Router | SSR, Server Actions, Edge Middleware |
| Estilos | Tailwind CSS | Utilidades mobile-first, sin CSS custom |
| Server state | TanStack Query | Caché, revalidación, optimistic updates |
| Validación | Zod | Schema-first, compartido server/client |
| Backend | Supabase (PostgreSQL + RLS) | Auth + DB + Storage en uno |
| IA | OpenRouter → Anthropic | Un API key, cambio de modelo sin tocar código |
| Pagos | Stripe | Estándar del sector, webhooks robustos |
| Deploy | Vercel | Zero-config con Next.js |
| Paquetes | pnpm | Más rápido que npm, menos disco que yarn |

## Decisiones clave (no cambiar sin discutir)

### 1. No usar Supabase Edge Functions en MVP
Usar Next.js Server Actions para toda la lógica de negocio. Razón: debugging más fácil, deploy en Vercel sin fricción, sin contexto de ejecución distinto.

### 2. No usar Google Vision para OCR
Claude Haiku con visión hace imagen → JSON en una llamada. Elimina dependencia externa y reduce latencia.

### 3. Server Actions sobre API Routes para mutaciones
`"use server"` + `revalidatePath` / invalidar TanStack Query. Solo usar Route Handlers para webhooks (Stripe) o endpoints que necesiten ser llamados desde fuera.

### 4. RLS siempre activo — nunca service_role en frontend
Toda operación de usuario pasa por RLS. `SUPABASE_SERVICE_ROLE_KEY` solo en Server Actions/webhooks para operaciones admin.

### 5. Schema de tipos primero
`src/types/index.ts` y `src/lib/validations.ts` completos antes de cualquier componente UI.

### 6. Middleware Stripe desde el día 1
Aunque el pago no esté activo, el middleware de verificación de suscripción existe desde la semana 1 para evitar refactoring masivo.

### 7. OpenRouter compatible con SDK de Anthropic
`aiClient` en `src/lib/ai.ts` usa el SDK oficial de Anthropic con `baseURL` apuntando a OpenRouter. Mismo código, distinto endpoint.

## Estructura de carpetas

```
src/
├── app/                    # App Router (Next.js)
│   ├── (auth)/             # Grupo de rutas sin layout principal
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/          # Vista principal post-login
│   ├── products/           # CRUD inventario
│   ├── recipes/            # Generador IA
│   ├── stats/              # Gamificación + historial
│   ├── settings/           # Perfil + suscripción
│   ├── pricing/            # Planes y precios
│   └── api/                # Route Handlers (webhooks)
│       └── webhooks/
│           └── stripe/
├── components/             # Componentes reutilizables
│   ├── ui/                 # Primitivos (Button, Card, Badge...)
│   ├── layout/             # Header, Nav, Shell
│   ├── products/           # ProductCard, ProductForm...
│   ├── recipes/            # RecipeCard, RecipeGenerator...
│   ├── gamification/       # StreakBadge, PointsDisplay...
│   └── auth/               # LoginForm, RegisterForm...
├── actions/                # Server Actions
├── hooks/                  # Custom hooks (useProducts, useStats...)
├── lib/                    # Utilidades y clientes
│   ├── ai.ts               # Cliente OpenRouter/Anthropic
│   ├── utils.ts            # Helpers generales
│   ├── validations.ts      # Schemas Zod
│   └── supabase/           # Clientes Supabase (client/server/middleware)
├── middleware.ts            # Auth + premium guard
└── types/
    └── index.ts             # Tipos TypeScript globales

supabase/
└── schema.sql              # Schema completo + seed

docs/
├── ARCHITECTURE.md         # Este archivo
├── PROBLEMS.md             # Registro de problemas y soluciones
└── ROADMAP.md              # Roadmap del MVP
```
