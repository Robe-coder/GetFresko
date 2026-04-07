# GetFresko — Roadmap MVP (30 días)

## Semana 1 — Core Funcional
- [ ] Setup Next.js 14 + Supabase + Tailwind ✅
- [ ] Auth (email + Google OAuth)
- [ ] RLS completo en todas las tablas ✅ (en schema.sql)
- [ ] CRUD productos con todos los campos
- [ ] Sistema caducidad automática con predicción por location
- [ ] Layout mobile-first base

## Semana 2 — Retención
- [ ] Dashboard con alertas de caducidad (rojo <2d, naranja <5d)
- [ ] Gamificación básica (FreskoPoints + streak)
- [ ] Badges básicos
- [ ] Marcar producto como comido/desperdiciado

## Semana 3 — Diferencial IA
- [ ] Generador de recetas con claude-sonnet-4-6 vía OpenRouter
- [ ] Caché de recetas (recipes_cache + hash SHA-256)
- [ ] Límites del plan gratuito (middleware de cuotas)
- [ ] OCR de tickets con claude-haiku-4-5 vision

## Semana 4 — Monetización y Deploy
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
