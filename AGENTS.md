# Larsa Play

Responde siempre en español.

## Objetivo

Construir una plataforma full-stack para gestionar cuentas de streaming, proveedores, productos, clientes, perfiles, vencimientos, reportes, pagos y automatizaciones de WhatsApp/n8n.

## Stack

- Next.js App Router con TypeScript estricto.
- Tailwind CSS para estilos.
- PostgreSQL con Prisma ORM.
- Sesiones mediante cookie `httpOnly`; no guardar tokens en `localStorage`.
- Validación runtime con Zod en todos los endpoints que acepten datos.

## Reglas de trabajo

- No copiar marcas, logos, assets privados ni código de Netfly.
- Mantener equivalencia funcional bajo la marca Larsa Play.
- Usar DTOs explícitos para respuestas de API y props cliente.
- No exponer `passwordHash`, cookies, tokens ni variables sensibles.
- Agregar índices Prisma para columnas usadas en filtros, relaciones y ordenamiento.
- Evitar acciones destructivas sin confirmación del usuario.

## Comandos

- Desarrollo: `npm run dev`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Migración local: `npm run prisma:migrate`
- Seed: `npm run db:seed`
