# GetFresko — Roadmap MVP (30 días)

## Core Funcional ✅
- [x] Setup Next.js 14 + Supabase + Tailwind
- [x] Auth (email + Google OAuth)
- [x] RLS completo en todas las tablas
- [x] CRUD productos con todos los campos
- [x] Layout mobile-first base

## Retención ✅
- [x] Dashboard con alertas de caducidad (rojo <2d, naranja <5d)
- [x] Gamificación completa (FreskoPoints + streak + badges)
- [x] Marcar producto como comido/desperdiciado
- [x] Estadísticas de progreso

## Diferencial IA ✅
- [x] Generador de recetas con claude-sonnet-4-6 vía OpenRouter
- [x] Caché de recetas (recipes_cache + hash SHA-256)
- [x] OCR de tickets con claude-haiku-4-5 vision
- [x] OCR: no-alimentos guardados en consumption_events (ticket_non_food)
- [x] OCR: botón X por producto para eliminar antes de añadir a despensa
- [x] OCR: aclaración de nombres truncados/ambiguos (sugerencias + input libre)
- [x] OCR: auto-detección de básicos desde ticket
- [x] Onboarding: T&C + selector de provincia en primer login
- [x] consumption_events: registro de todos los consumos (base datos monetización)
- [ ] Límites del plan gratuito (middleware de cuotas) — siguiente

## Monetización y Deploy
- [ ] Integración Stripe (checkout + webhooks)
- [ ] Middleware de protección de features premium
- [ ] Onboarding optimizado
- [ ] Deploy producción en Vercel

---

## Post-MVP (Fase 2)
- [ ] Capacitor para native mobile (iOS/Android)
- [ ] Planificador semanal automático
- [ ] Compartir inventario (plan Familia)
- [ ] Anuncios (plan gratuito)
- [ ] Internacionalización (i18n)
