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
