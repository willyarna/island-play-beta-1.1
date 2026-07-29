# ADR-002: Evolucionar Larsa Play a SaaS multi-cliente

## Status

Accepted

## Date

2026-07-18

## Context

Larsa Play Beta 1.0 funciona como una plataforma para gestionar una operacion
de venta de cuentas/perfiles streaming. El nuevo objetivo comercial es vender la
plataforma a multiples clientes, permitiendo que cada negocio gestione sus
propios proveedores, servicios, cuentas, clientes, vencimientos y reportes.

Tambien se desea una version SuperAdmin para administrar clientes SaaS,
suscripciones, planes y acceso. Los planes futuros incluyen automatizaciones con
n8n/WhatsApp para recordatorios y alertas.

La Beta 1.0 aun es mononegocio. Antes de venderla a terceros se necesita
separacion estricta de datos por negocio.

## Decision

Convertir Larsa Play en una aplicacion SaaS multi-tenant basada en
organizaciones.

Se agregaran entidades:

- `Organization`: representa cada negocio cliente.
- `Membership`: relaciona usuarios con organizaciones.
- `Plan`: define capacidades comerciales.
- `Subscription`: representa el plan contratado, estado y vencimiento.

Se agregara rol `SUPERADMIN` para administrar organizaciones, usuarios,
planes, vencimientos y soporte.

Todas las entidades operativas deberan pertenecer a una organizacion:

- Proveedores.
- Servicios/productos.
- Cuentas.
- Perfiles.
- Clientes.
- Movimientos.
- Settings.

Todas las APIs deberan filtrar por la organizacion activa del usuario. El
SuperAdmin podra consultar organizaciones de forma controlada.

## Alternatives Considered

### Mantener una instalacion por cliente

Pros:

- Aislamiento fuerte.
- Menos cambios iniciales al modelo actual.

Cons:

- Dificil de administrar.
- Dificil de actualizar.
- Multiplica costos y operaciones.
- Complica pagos, soporte y automatizaciones.

Rejected: no escala para vender y actualizar la plataforma con facilidad.

### Usar bases de datos separadas por cliente

Pros:

- Aislamiento muy alto.
- Puede simplificar borrado/exportacion por cliente.

Cons:

- Mayor complejidad operativa.
- Migraciones multi-base mas complejas.
- No es necesario para una beta SaaS temprana.

Rejected for now: puede evaluarse en futuro si hay requisitos empresariales.

### Multi-tenant por `organizationId` en una sola base

Pros:

- Simple de desplegar en Vercel/Neon.
- Facil de operar en una etapa temprana.
- Permite SuperAdmin centralizado.
- Menor costo.
- Facilita reportes globales y planes.

Cons:

- Requiere disciplina estricta en filtros por organizacion.
- Requiere pruebas para evitar fuga de datos.

Accepted.

## Consequences

- Se debe migrar la data existente a una organizacion inicial.
- Toda API debe resolver la organizacion activa desde sesion/membership.
- Los DTOs deben evitar exponer datos de otras organizaciones.
- Los indices Prisma deben incluir columnas usadas para filtros multi-tenant.
- Se deben agregar pruebas o smoke tests que validen aislamiento entre
  organizaciones.
- Las automatizaciones Premium dependeran del plan/suscripcion activa.
- Pagos y checkout deben crear/activar organizaciones de forma segura.

## Implementation Order

1. Agregar modelos `Organization`, `Membership`, `Plan`, `Subscription`.
2. Agregar `SUPERADMIN` a `UserRole`.
3. Agregar `organizationId` a entidades operativas.
4. Migrar datos existentes a organizacion inicial.
5. Actualizar seeds.
6. Actualizar seguridad/API para resolver organizacion activa.
7. Crear panel SuperAdmin minimo.
8. Agregar gating por plan.
9. Preparar checkout/pagos.
10. Integrar n8n/WhatsApp para plan Premium.

