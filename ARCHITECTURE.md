# Arquitectura de Larsa Play

Larsa Play es una aplicación full-stack con Next.js App Router. El frontend usa Server Components para cargar el estado inicial y Client Components para la experiencia interactiva del panel.

## Capas

- `src/app`: páginas y Route Handlers.
- `src/components`: componentes de interfaz reutilizables.
- `src/lib`: Prisma, seguridad, validación y utilidades.
- `src/types`: DTOs compartidos entre servidor y cliente.
- `prisma`: esquema de base de datos y seed reproducible.

## Dominio

El núcleo del sistema está compuesto por:

- `Provider`: proveedor mayorista.
- `Product`: plataforma o servicio vendido.
- `Account`: cuenta comprada al proveedor.
- `Profile`: perfil dentro de una cuenta, asignable a un cliente.
- `Client`: cliente final.
- `Movement`: ingresos y egresos.
- `Setting`: configuración global, WhatsApp y plantilla.
- `User` y `Session`: acceso administrativo.

## Seguridad

La sesión se guarda como token opaco en cookie `httpOnly`. En base de datos se almacena solo el hash SHA-256 del token. Las contraseñas de usuarios se guardan con bcrypt.

Los endpoints validan datos con Zod y requieren sesión activa. La app configura cabeceras básicas de seguridad desde `next.config.ts`.

## Próximos módulos

- Fundacion SaaS multi-cliente con `Organization`, `Membership`, planes y suscripciones.
- Panel SuperAdmin para administrar clientes de la plataforma.
- Pagos y habilitacion automatica de planes.
- Integracion real con WhatsApp mediante n8n para plan Premium.
- Auditoria, aislamiento de datos y hardening de produccion.

Ver tambien:

- `PROJECT_MEMORY.md`
- `docs/HANDOFF-SUMMARY.md`
- `docs/decisions/0002-evolve-to-multi-tenant-saas.md`
