# GetFresko — Registro de Problemas y Soluciones

> Documento vivo. Cada vez que se resuelve un problema no trivial, se añade aquí para no repetirlo.

---

## Formato de entrada

```
## [FECHA] Título del problema
**Síntoma:** Qué fallaba / cómo se manifestaba
**Causa:** Por qué ocurría
**Solución:** Qué se hizo para arreglarlo
**Archivos afectados:** lista de archivos
**Tags:** #categoria
```

---

## [2026-04-07] create-next-app rechaza el nombre "GetFresko" por mayúsculas

**Síntoma:** `pnpm create next-app@latest .` falla con "name can no longer contain capital letters" porque la carpeta se llama `GetFresko`.

**Causa:** npm impone que los nombres de paquetes sean lowercase. `create-next-app` usa el nombre de la carpeta destino como nombre del paquete.

**Solución:** Crear el proyecto en `/tmp/getfresko` (nombre válido) e instalar dependencias allí, luego copiar todos los archivos a `D:\GetFresko`. El `name` en `package.json` queda como `getfresko` (lowercase), que es correcto.

**Archivos afectados:** `package.json`

**Tags:** #setup #npm #nextjs

---

## [2026-04-07] Disco C: lleno — instalación de dependencias fallaba con ERR_PNPM_ENOSPC

**Síntoma:** `pnpm install` fallaba con `ERR_PNPM_ENOSPC` en C: (solo 442MB libres en disco de 120GB).

**Causa:** El proyecto estaba apuntando a `C:\Users\user\GetFresko` pero el disco estaba prácticamente lleno.

**Solución:** Trabajar en `D:\GetFresko` que tiene ~26GB libres. Usar `/tmp` (que va a C:) solo para el scaffold inicial de Next.js y mover inmediatamente a D:.

**Tags:** #setup #disk-space #windows

---

## [2026-04-13] next-pwa webpack config conflicto con Next.js 16 Turbopack

**Síntoma:** `pnpm build` falla con "This build is using Turbopack, with a webpack config and no turbopack config."

**Causa:** `@ducanh2912/next-pwa` inyecta configuración webpack; Next.js 16 usa Turbopack por defecto y lo rechaza sin `turbopack: {}` declarado.

**Solución:** Añadir `turbopack: {}` en `next.config.ts` para indicar explícitamente que se acepta la coexistencia.

**Archivos afectados:** `next.config.ts`

**Tags:** #nextjs16 #pwa #turbopack

---

## [2026-04-13] middleware.ts deprecado en Next.js 16 — renombrar a proxy.ts

**Síntoma:** Warning en dev: "The 'middleware' file convention is deprecated. Please use 'proxy' instead." Build falla con "Proxy is missing expected function export name".

**Causa:** Next.js 16 renombra la convención `middleware.ts` → `proxy.ts` y la función exportada `middleware` → `proxy`.

**Solución:** Renombrar archivo a `src/proxy.ts` y renombrar la función exportada de `middleware` a `proxy`.

**Archivos afectados:** `src/proxy.ts` (antes `src/middleware.ts`)

**Tags:** #nextjs16 #proxy #breaking-change

---

## [2026-04-16] gh no está en PATH del bash de Claude Code tras instalar con winget

**Síntoma:** `gh auth status` falla con "command not found" aunque GitHub CLI está instalado.

**Causa:** winget instala `gh` en `C:\Program Files\GitHub CLI\` pero el bash que usa Claude Code no carga el PATH de Windows actualizado. Los comandos `where gh` y `which gh` no lo encuentran.

**Solución:** Usar la ruta absoluta: `"/c/Program Files/GitHub CLI/gh.exe"`. Para `git push` normal no hace falta `gh` — funciona directamente porque el token queda en el keyring de Windows.

**Archivos afectados:** ninguno

**Tags:** #git #github-cli #windows #path

---

## [2026-04-16] Repo GitHub no existía — remote apuntaba al vacío

**Síntoma:** `git push origin main` fallaba con "repository not found". `git remote -v` no mostraba nada (sin remote configurado).

**Causa:** El repo `github.com/Robe-coder/GetFresko` nunca se había creado en GitHub. Solo existía el repo local en `D:\GetFresko`.

**Solución:** Crear el repo con `gh repo create GetFresko --public --source=. --push`. Como el remote `origin` ya había sido añadido y fallado antes, hubo que hacer `git remote remove origin` primero y luego `git remote add origin https://github.com/Robe-coder/GetFresko.git && git push -u origin main`.

**Archivos afectados:** ninguno (configuración de git)

**Tags:** #git #github #setup #remote

---

## [2026-04-16] add_freskopoints y update_streak faltaban en schema.sql

**Síntoma:** Las Server Actions llamaban a `supabase.rpc('add_freskopoints', ...)` y `supabase.rpc('update_streak', ...)` pero las funciones no estaban documentadas en `supabase/schema.sql`.

**Causa:** Estas funciones se añadieron a la base de datos en sesión 2 vía SQL Editor de Supabase pero no se actualizó el schema.sql del repo.

**Solución:** Añadir ambas funciones a `supabase/schema.sql` junto con la tabla `user_badges`. Ejecutar el bloque nuevo en el SQL Editor de Supabase si no existe.

**Archivos afectados:** `supabase/schema.sql`

**Tags:** #supabase #sql #gamificacion

---

## [2026-04-08] VSCode abría la carpeta vacía en C: en lugar del proyecto en D:

**Síntoma:** El proyecto no aparecía en VSCode — la carpeta abierta estaba vacía.

**Causa:** Había dos carpetas `GetFresko`: una vacía en `C:\Users\user\GetFresko` (la que Claude Code tenía como working directory por defecto) y el proyecto real en `D:\GetFresko`.

**Solución:** En VSCode usar `File → Open Folder` y seleccionar `D:\GetFresko`. Para las próximas sesiones de Claude Code, asegurarse de abrirlo desde `D:\GetFresko`.

**Tags:** #setup #vscode #windows

---
