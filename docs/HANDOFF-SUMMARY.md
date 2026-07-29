# Handoff Summary: Larsa Play Beta 1.0

Este documento resume el estado del proyecto para otro desarrollador, cuenta de
Codex o equipo que necesite continuar el trabajo.

## Proyecto

Larsa Play es una plataforma full-stack para gestion de negocios que venden
cuentas/perfiles de streaming. Permite administrar proveedores, servicios,
cuentas, perfiles, clientes, vencimientos, movimientos, reportes y preparacion
para automatizaciones con WhatsApp/n8n.

El producto evolucionara a SaaS multi-cliente con SuperAdmin, planes y pagos.

## Repositorio y deploy

- GitHub privado: `https://github.com/willyarna/larsa-play-beta-1.0`
- Vercel beta: `https://larsa-play-beta-1-0-ten.vercel.app`
- Base de datos beta: Neon Postgres, proyecto `larsa-play-beta`
- Tag base: `v1.0.0-beta`

No guardar ni compartir `DATABASE_URL`, tokens GitHub ni claves de Neon.

## Stack

- Next.js App Router.
- TypeScript.
- React.
- Tailwind CSS.
- Prisma ORM.
- PostgreSQL.
- Zod.
- bcryptjs.
- Cookies `httpOnly` para sesiones.
- Vercel + Neon para beta.

## Comandos utiles

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run prisma:migrate
npm run prisma:deploy
npm run db:seed
```

En el entorno local original puede ser necesario usar variantes `*:local` por
permisos/rutas especiales:

```bash
npm run dev:local
npm run build:local
npm run prisma:migrate:local
npm run db:seed:local
```

## Variables de entorno

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
SESSION_COOKIE_NAME="larsa_session"
SESSION_COOKIE_SECURE="true"
```

En local `SESSION_COOKIE_SECURE` puede ser `"false"` si se usa HTTP.

## Acceso inicial

Seed crea:

- Email: `admin@larsaplay.local`
- Password: `admin123`

Antes de clientes reales se debe cambiar la contrasena y agregar UI para cambio
seguro.

## Estructura relevante

- `src/app`: paginas y API route handlers.
- `src/components/AppShell.tsx`: panel principal y modales.
- `src/components/LoginForm.tsx`: landing/login.
- `src/lib/security.ts`: sesiones, login y seguridad.
- `src/lib/validation.ts`: esquemas Zod.
- `src/types/app.ts`: DTOs compartidos.
- `prisma/schema.prisma`: modelo de datos.
- `prisma/seed.ts`: datos iniciales.
- `docs/decisions`: decisiones arquitectonicas.
- `PROJECT_MEMORY.md`: memoria viva del proyecto.

## Funcionalidades completadas

- Login/logout.
- Landing publica de Larsa Play.
- Panel con navegacion.
- CRUD de servicios/productos.
- CRUD de proveedores con:
  - ofertas por servicio,
  - costo de proveedor,
  - WhatsApp soporte,
  - WhatsApp pagos/recargas,
  - exportacion XLSX.
- CRUD de cuentas.
- Perfiles por cuenta.
- Asignacion de clientes a perfiles.
- Clientes activos/inactivos segun asignaciones.
- Eliminacion multiple en clientes.
- Eliminacion multiple en cuentas con validacion de perfiles asignados.
- Paginacion y filas por pagina.
- Filtros de cuentas.
- Colores por vencimiento.
- Exportacion/importacion XLSX en modulos clave.
- Reportes basicos de inversion, venta y ganancia.
- Plantillas y previews para mensajes WhatsApp.
- Variables Vercel y Neon conectadas.
- Migraciones Prisma aplicadas en Neon.

## Restricciones importantes

- No copiar assets, codigo ni marcas de Netfly.
- Mantener Larsa Play como marca propia.
- No subir `docs/research/netfly`, screenshots de Netfly, tokens ni `.env`.
- El repo subido ya excluye material sensible conocido.

## Estado tecnico actual

La Beta 1.0 es mononegocio. Todavia no esta lista para multiples clientes SaaS
con datos separados. Si se comercializa tal cual, todos los datos vivirian en el
mismo espacio logico. El siguiente trabajo debe ser multi-tenant.

## Roadmap inmediato

1. Clonar repo en carpeta limpia de desarrollo.
2. Crear rama `v1.1.0-saas-foundation`.
3. Implementar `Organization`.
4. Implementar `Membership`.
5. Agregar rol `SUPERADMIN`.
6. Agregar `Plan` y `Subscription`.
7. Agregar `organizationId` a entidades del dominio.
8. Migrar datos actuales a organizacion inicial.
9. Aplicar filtros por organizacion en todas las APIs.
10. Crear panel SuperAdmin minimo.

## Roadmap comercial

Basico:

- Gestion manual sin automatizaciones.

Pro:

- Reportes avanzados, importacion/exportacion y control de margen.

Premium:

- Automatizaciones WhatsApp/n8n, alertas y recordatorios automaticos.

## Pendientes criticos antes de vender

- Multi-tenant.
- SuperAdmin.
- Cambio de contrasena.
- Recuperacion de contrasena.
- Auditoria de acciones.
- Politicas/terminos.
- Backups de base de datos.
- Integracion de pagos.
- Hardening de seguridad.

