# Island Play — Project Handoff

> **START HERE.** Este documento resume el contexto mínimo para continuar el proyecto sin conocimiento previo. Después de leerlo, sigue los documentos enlazados en la sección [Lectura obligatoria](#lectura-obligatoria).

## Visión del producto

Island Play es una plataforma para revendedores de servicios digitales y streaming. Su objetivo es centralizar clientes, proveedores, servicios, cuentas, perfiles, vencimientos, ventas, costos, movimientos financieros y automatizaciones.

La dirección confirmada es evolucionar la beta actual hacia un SaaS multi-tenant. Cada revendedor será una `Organization`, con datos operativos aislados. La arquitectura seguirá siendo inicialmente un monolito modular; no se migrará a microservicios sin una necesidad real.

La estrategia de seguridad para credenciales recuperables ya fue aprobada y está documentada en `docs/architecture/CREDENTIAL_SECURITY.md`. Todavía no está implementada: el comportamiento AS-IS continúa vigente hasta completar y verificar la migración.

## Estado actual

**Beta mononegocio funcional. No preparada aún para onboarding SaaS multi-tenant.**

El sistema actual incluye:

- login con email y contraseña y sesiones persistidas;
- CRUD de clientes, proveedores, ofertas, servicios y cuentas;
- perfiles asignables a clientes;
- ventas individuales y ventas de combos;
- movimientos financieros y reportes básicos;
- plantillas y enlaces manuales de WhatsApp;
- esquema PostgreSQL y migraciones Prisma.

Todavía no existen `Organization`, memberships, registro público, OAuth, planes, suscripciones, pagos autoservicio, autorización por tenant ni automatización real de WhatsApp/n8n.

## Stack

- Next.js App Router con React y TypeScript estricto.
- Tailwind CSS y CSS propio.
- PostgreSQL con Prisma ORM.
- Zod para validación runtime.
- bcryptjs para contraseñas de usuarios.
- Sesiones propias mediante cookie `httpOnly` y tokens opacos con hash en base de datos.
- Playwright instalado para scripts manuales de smoke/capturas; no existe todavía una suite automatizada formal.

Las versiones exactas deben consultarse en `package-lock.json`; `package.json` utiliza rangos semver.

## Arquitectura actual

```text
Browser
  → Next.js App Router
      → Server Component principal
      → Client Component AppShell
      → Route Handlers /api/*
          → Prisma
              → PostgreSQL
```

`src/app/page.tsx` autentica y carga el estado inicial. `src/components/AppShell.tsx` concentra la mayor parte del panel y de la lógica interactiva. Las APIs usan Prisma directamente y requieren una sesión, pero todavía no aplican autorización por rol u organización.

## Infraestructura conocida

Contexto confirmado por el propietario:

- código alojado en GitHub;
- despliegue mediante Vercel;
- PostgreSQL alojado en Neon;
- Vercel Production apunta a Neon production;
- Vercel Preview apunta a Neon staging.

La configuración efectiva de backups, observabilidad, alertas y rollback no está demostrada por el repositorio y debe verificarse antes de cambios de datos.

## Decisiones confirmadas

- Cada revendedor será una `Organization`.
- Inicialmente una organización tendrá un solo login, sin gestión de empleados en UI.
- Los datos no se acoplarán directamente al usuario; la arquitectura permitirá memberships futuras.
- Habrá un SuperAdmin para plataforma, planes, suscripciones, trials, acceso, billing y métricas globales.
- El SuperAdmin no tendrá acceso operativo ordinario a datos privados del tenant.
- La suscripción pertenecerá a la organización.
- Se contemplan accesos `TRIAL`, `PAID` y `ADMIN_GRANT`, o equivalentes.
- Los planes iniciales serán al menos `BASIC` y `PREMIUM`.
- BASIC tendrá inicialmente capacidad para hasta 100 clientes finales activos por `Organization`.
- PREMIUM podrá ofrecer mayor capacidad de clientes, con límite exacto todavía por definir, y se diferenciará principalmente por automatizaciones.
- Seguridad, aislamiento, integridad y auditoría mínima estarán disponibles en todos los planes.
- Se buscará registro autoservicio, OAuth y pagos internacionales.
- n8n podrá orquestar automatizaciones, pero Island Play seguirá siendo la fuente de verdad.
- Se mantendrá un monolito modular mientras no exista una razón real para separarlo.

El registro normativo completo está en `docs/architecture/DECISIONS.md`.

## Riesgos principales

1. No existe aislamiento multi-tenant ni autorización real.
2. Las contraseñas de cuentas de streaming se almacenan y entregan en texto plano.
3. Existe una credencial administrativa demo embebida en el flujo actual; debe retirarse antes de comercializar.
4. `accessUntil` se muestra, pero no controla el acceso.
5. No existe una entidad de venta/renovación; la trazabilidad financiera depende de perfiles y texto libre en `Movement`.
6. Las ventas de combo no conservan una venta estructurada ni validan completamente sus ítems financieros.
7. La edición de cuentas borra y recrea perfiles.
8. No hay pruebas automáticas de seguridad, dominio, concurrencia o aislamiento.
9. No hay health check, runbook de rollback ni observabilidad demostrada.
10. Los overrides CSS finales rompen parte del layout móvil.

## Rama y fase actual

- Rama de trabajo: `security/credential-hardening`.
- Fase: **B — contención de riesgos críticos actuales**.
- Estado: dirección de seguridad de credenciales aprobada y documentada; implementación todavía no iniciada.

## Lectura obligatoria

1. `AGENTS.md` — reglas operativas del repositorio.
2. `docs/architecture/AS_IS.md` — descripción técnica comprobada del sistema actual.
3. `docs/architecture/DECISIONS.md` — decisiones aceptadas por el propietario.
4. `docs/architecture/CREDENTIAL_SECURITY.md` — contrato arquitectónico aprobado para custodia, exposición, entrega, migración y rotación de credenciales.
5. `docs/ROADMAP.md` — orden de macrofases.

## Siguiente paso

El siguiente paso es **B1 — contrato criptográfico + tests**. Deberá implementar y verificar el contrato AES-256-GCM y `KeyProvider` aprobado, sin iniciar todavía la migración destructiva de datos. Después continuará la minimización de DTOs, el revelado explícito y la migración expand → migrate → contract conforme al documento de seguridad.

## Reglas de seguridad

- Nunca versionar ni mostrar secretos, cookies, tokens, hashes o URLs reales de base de datos.
- No exponer `passwordHash` ni objetos Prisma completos sin un DTO explícito.
- Mantener sesiones en cookies `httpOnly`; no guardar tokens de autenticación en `localStorage`.
- Validar con Zod todos los endpoints que reciban datos.
- Aplicar autorización y tenant server-side; la UI no es una frontera de seguridad.
- Evitar que SuperAdmin acceda por defecto a datos operativos privados.
- Toda estrategia para credenciales de streaming debe incluir cifrado, control de acceso y auditoría.
- Probar aislamiento negativo: un tenant nunca debe consultar o mutar recursos de otro.

## Qué no debe hacerse

- No comercializar la aplicación como multi-tenant antes de implementar y probar aislamiento real.
- No agregar `organizationId` de forma parcial ni confiar en filtros enviados por el navegador.
- No acoplar los datos operativos directamente a `User`.
- No tratar `accessUntil` del usuario actual como el modelo definitivo de suscripción.
- No convertir n8n en fuente de verdad de ventas, inventario, clientes o finanzas.
- No seleccionar o integrar una pasarela de pago sin una decisión explícita.
- No migrar prematuramente a microservicios.
- No ejecutar migraciones, seeds o scripts de publicación sin revisar alcance, entorno, backup y rollback.
- No copiar marcas, logos, assets privados ni código de terceros.
