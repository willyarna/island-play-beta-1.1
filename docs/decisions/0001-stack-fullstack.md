# ADR 0001: Stack full-stack inicial

## Decisión

Usar Next.js App Router, React, TypeScript, Tailwind CSS, Prisma ORM y PostgreSQL.

## Contexto

El proyecto empezó como una beta estática para validar flujo y estética. El objetivo actual es convertirlo en una plataforma comercial con autenticación, persistencia, reportes y despliegue reproducible.

## Consecuencias

- Next.js permite frontend y backend integrados sin mantener dos aplicaciones separadas.
- Prisma da migraciones versionadas y un modelo explícito del dominio.
- PostgreSQL permite crecer hacia reportes, pagos, auditoría e integraciones.
- Se requiere configurar `DATABASE_URL` antes de migrar o ejecutar seeds.
