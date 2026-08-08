# Roadmap de transformación de Island Play

## Propósito

Este roadmap define exclusivamente macrofases. No constituye todavía un backlog técnico ni autoriza cambios de código, esquema o infraestructura.

## A. Baseline y documentación

Consolidar el estado AS-IS, las decisiones aceptadas, las reglas del repositorio y los criterios de preparación para las fases posteriores.

## B. Contención de riesgos críticos actuales

Reducir primero los riesgos de credenciales, acceso administrativo, autorización y exposición de información sensible que impiden una comercialización segura.

## C. Tests mínimos de seguridad y dominio

Crear una línea base verificable para autenticación, autorización, ventas, inventario, finanzas, concurrencia y futuros casos negativos de aislamiento.

## D. Organization y tenant foundation

Introducir el concepto de organización y la relación entre identidad, organización y datos operativos sin acoplar el dominio directamente a `User`.

## E. Autorización y aislamiento

Aplicar el contexto tenant y los permisos en backend, APIs, consultas, respuestas y operaciones administrativas.

## F. Migración de datos actuales y SuperAdmin/control plane

Asignar los datos mononegocio existentes a una organización inicial mediante un proceso verificable, recuperable y compatible con staging/production.

Después de contar con Organization, contexto tenant y autorización, construir el control plane mínimo de SuperAdmin: listar Organizations, consultar estado de acceso/suscripción, realizar asignaciones administrativas, otorgar `ADMIN_GRANT`/cortesías, suspender/reactivar y administrar planes/suscripciones. Esta superficie no tendrá acceso operativo ordinario a datos privados del tenant.

## G. Modelo de venta y renovación

Formalizar ventas, ítems, renovaciones, asignaciones, cancelaciones, historial e idempotencia como dominio persistente.

## H. Finanzas, costos y márgenes

Relacionar ingresos, costo de venta, gastos y ajustes con sus operaciones de origen para producir reportes confiables por periodo y dimensión.

## I. UX de ventas y combos

Unificar catálogo, inventario, venta individual, venta de combo y entrega al cliente alrededor del modelo comercial definido.

## J. Responsive

Consolidar el sistema visual y garantizar los flujos operativos críticos en móvil, tablet y escritorio.

## K. Planes, suscripciones y trial

Modelar planes, accesos, trials, estados de suscripción y entitlements pertenecientes a la organización.

## L. Registro, OAuth y onboarding

Incorporar onboarding autoservicio y los mecanismos de identidad aprobados, creando la organización y una Subscription/Trial coherente durante el registro.

## M. Pagos autoservicio

Habilitar compra, renovación, cambio, cancelación y recuperación de acceso mediante webhooks idempotentes del proveedor de pagos seleccionado.

## N. WhatsApp y automatizaciones

Permitir configuraciones aisladas por organización, programación, envío, reintentos, estados e historial; n8n podrá actuar como orquestador, no como fuente de verdad.

## O. Escala y observabilidad

Completar health checks, logging seguro, métricas, alertas, auditoría, rendimiento, recuperación y criterios reales para separar servicios si fuera necesario.
