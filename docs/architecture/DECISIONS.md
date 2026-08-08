# Decisiones arquitectónicas y de producto confirmadas

## Propósito

Este documento registra las decisiones confirmadas por el propietario después de revisar la auditoría AS-IS. Todas tienen estado `ACCEPTED`.

No define todavía el modelo Prisma definitivo, la pasarela de pago, el proveedor de WhatsApp, el mecanismo exacto de cifrado ni tareas de implementación. Esas decisiones requieren diseño posterior.

## D-001 — Evolución a SaaS multi-tenant

**Estado:** ACCEPTED

**Decisión:** Island Play evolucionará hacia un SaaS multi-tenant.

**Motivo:** El producto debe servir a múltiples revendedores desde una plataforma compartida.

**Consecuencias:** La arquitectura futura debe incorporar identidad de tenant, aislamiento, onboarding, suscripciones y operación segura para múltiples negocios.

## D-002 — Cada revendedor es una Organization

**Estado:** ACCEPTED

**Decisión:** Cada revendedor o negocio cliente se representará como una `Organization`.

**Motivo:** El negocio, no el usuario individual, es la unidad propietaria de clientes, proveedores, inventario, ventas y configuración.

**Consecuencias:** Los datos operativos y las suscripciones deberán pertenecer a `Organization`.

## D-003 — Un solo usuario inicial por Organization

**Estado:** ACCEPTED

**Decisión:** En la primera versión SaaS, cada organización tendrá un solo usuario/login.

**Motivo:** Reducir la complejidad inicial del producto y del onboarding.

**Consecuencias:** No es necesario entregar todavía flujos de invitación o administración de equipos.

## D-004 — Sin gestión de empleados en la UI inicial

**Estado:** ACCEPTED

**Decisión:** El revendedor no podrá agregar empleados desde la interfaz inicial.

**Motivo:** La experiencia inicial está orientada a un único operador por negocio.

**Consecuencias:** No se diseñarán pantallas de miembros, invitaciones o permisos delegados en la primera etapa.

## D-005 — El dominio no se acopla directamente a User

**Estado:** ACCEPTED

**Decisión:** Aunque inicialmente exista un usuario por organización, los datos operativos no pertenecerán directamente a `User`.

**Motivo:** Permitir múltiples usuarios o memberships futuras sin reconstruir el dominio.

**Consecuencias:** La propiedad primaria será `Organization`; la relación identidad-organización deberá quedar separada del dominio operativo.

## D-006 — Existencia de SuperAdmin

**Estado:** ACCEPTED

**Decisión:** Island Play tendrá un rol o superficie de SuperAdmin.

**Motivo:** La plataforma necesita administración central de clientes SaaS y de su operación comercial.

**Consecuencias:** Debe existir una frontera clara entre administración de plataforma y operación privada del tenant.

## D-007 — Alcance del SuperAdmin

**Estado:** ACCEPTED

**Decisión:** SuperAdmin administrará organizaciones, planes, suscripciones, trials, estados de acceso, billing de Island Play, métricas de plataforma y cuentas gratuitas/de cortesía.

**Motivo:** Esas capacidades pertenecen al operador de la plataforma SaaS.

**Consecuencias:** Se necesitará un dominio administrativo global separado del dominio operativo de cada organización.

## D-008 — Privacidad operativa frente a SuperAdmin

**Estado:** ACCEPTED

**Decisión:** SuperAdmin no tendrá acceso operativo ordinario a clientes finales, proveedores, costos, cuentas, contraseñas, ventas, gastos, ganancias o movimientos financieros del tenant.

**Motivo:** Proteger la confidencialidad comercial y operativa de cada revendedor.

**Consecuencias:** Las APIs, DTOs, permisos y herramientas de soporte deberán impedir ese acceso por defecto; ocultarlo solo en UI no será suficiente.

## D-009 — Aislamiento server-side y en datos

**Estado:** ACCEPTED

**Decisión:** El aislamiento entre organizaciones existirá en backend y modelo de datos, no solo en la interfaz.

**Motivo:** La UI no constituye una frontera de seguridad.

**Consecuencias:** Toda consulta y mutación operativa deberá resolverse dentro del contexto de una organización autorizada y probarse con casos negativos.

## D-010 — Organizaciones gratuitas/de cortesía

**Estado:** ACCEPTED

**Decisión:** SuperAdmin podrá crear organizaciones gratuitas o de cortesía sin generar un pago ficticio.

**Motivo:** La plataforma necesita soportar demos, alianzas, soporte y concesiones administrativas legítimas.

**Consecuencias:** Acceso, suscripción y pago no pueden modelarse como un único concepto inseparable.

## D-011 — Tipos de acceso explícitos

**Estado:** ACCEPTED

**Decisión:** Debe existir un tipo de acceso equivalente a `TRIAL`, `PAID` y `ADMIN_GRANT`.

**Motivo:** Diferenciar la razón por la cual una organización está habilitada.

**Consecuencias:** El modelo de acceso deberá representar concesiones sin pago y evitar movimientos financieros artificiales.

## D-012 — Planes iniciales BASIC y PREMIUM

**Estado:** ACCEPTED

**Decisión:** Inicialmente se proyectan al menos los planes `BASIC` y `PREMIUM`.

**Motivo:** Ofrecer una base funcional común y una opción con automatizaciones.

**Consecuencias:** Los entitlements deberán distinguir capacidades comerciales sin duplicar la aplicación.

## D-013 — Funciones fundamentales en ambos planes

**Estado:** ACCEPTED

**Decisión:** Las funciones fundamentales del negocio estarán disponibles en `BASIC` y `PREMIUM`.

**Motivo:** El valor central de Island Play es gestionar correctamente la operación del revendedor.

**Consecuencias:** Clientes, inventario, ventas, finanzas y vencimientos no dependerán del plan Premium.

## D-014 — Seguridad no es una función Premium

**Estado:** ACCEPTED

**Decisión:** Seguridad, aislamiento de datos y estabilidad no serán características Premium.

**Motivo:** Son requisitos básicos de la plataforma, no ventajas comerciales opcionales.

**Consecuencias:** Todos los tenants y planes recibirán los mismos controles esenciales de seguridad e integridad.

## D-015 — Premium se diferencia por automatización

**Estado:** ACCEPTED

**Decisión:** La diferenciación principal de Premium será la automatización.

**Motivo:** La automatización aporta valor adicional sin degradar el núcleo operativo del plan básico.

**Consecuencias:** El sistema de entitlements deberá concentrar la diferenciación en capacidades automáticas y avanzadas.

## D-016 — Alcance futuro de Premium

**Estado:** ACCEPTED

**Decisión:** Premium contemplará especialmente WhatsApp automático, recordatorios programados, automatizaciones, posible integración n8n, historial/log y configuración avanzada.

**Motivo:** Reducir el trabajo manual del revendedor y mejorar la continuidad de renovaciones.

**Consecuencias:** Se requerirán jobs, estados de ejecución, reintentos, auditoría y configuración aislada por organización.

## D-017 — Registro autoservicio

**Estado:** ACCEPTED

**Decisión:** El objetivo futuro incluye registro autoservicio.

**Motivo:** La adquisición y activación de revendedores no debe depender permanentemente del SuperAdmin.

**Consecuencias:** El onboarding deberá crear de forma consistente identidad, organización, acceso inicial y contexto de suscripción.

## D-018 — Opciones de autenticación futura

**Estado:** ACCEPTED

**Decisión:** Google OAuth y GitHub OAuth son mecanismos de autenticación futuros aceptados. Mantener también email/password para el registro público queda explícitamente como TBD.

**Motivo:** Facilitar el registro con proveedores de identidad aceptados, sin cerrar prematuramente la decisión sobre un flujo público adicional de email/password.

**Consecuencias:** El diseño de identidad deberá soportar Google OAuth y GitHub OAuth. La continuidad de email/password para registro público no debe asumirse hasta que se decida; esto no elimina la autenticación email/password existente del AS-IS.

## D-019 — Trial aproximado de 24 horas

**Estado:** ACCEPTED

**Decisión:** Una organización podrá iniciar con un trial, inicialmente pensado en aproximadamente 24 horas.

**Motivo:** Permitir evaluar el producto antes del pago.

**Consecuencias:** La duración exacta, momento de inicio y política de expiración quedan pendientes de especificación, pero el trial debe modelarse a nivel de organización.

## D-020 — Suscripción propiedad de Organization

**Estado:** ACCEPTED

**Decisión:** La suscripción pertenecerá a `Organization`, no simplemente a `User`.

**Motivo:** El negocio es el cliente comercial y futuro contenedor de uno o más usuarios.

**Consecuencias:** Acceso y entitlements se resolverán desde la suscripción organizacional.

## D-021 — Pago y renovación autoservicio

**Estado:** ACCEPTED

**Decisión:** El revendedor podrá pagar y renovar sin intervención manual del SuperAdmin.

**Motivo:** Evitar dependencia operativa y permitir crecimiento de la plataforma.

**Consecuencias:** Se necesitarán checkout, portal o flujo equivalente, webhooks idempotentes y sincronización de estados.

## D-022 — Comercialización internacional

**Estado:** ACCEPTED

**Decisión:** Island Play se diseñará con objetivo de comercialización internacional.

**Motivo:** El mercado objetivo abarca varios países.

**Consecuencias:** Moneda, timezone, métodos de pago, textos y requisitos operativos no deben quedar rígidamente acoplados a un solo país.

## D-023 — Acceso limitado después del vencimiento

**Estado:** ACCEPTED

**Decisión:** Una suscripción vencida no necesariamente impedirá completamente el login; podrá permitirse acceso a billing para renovar.

**Motivo:** Facilitar recuperación autoservicio del acceso.

**Consecuencias:** Autenticación, acceso a billing y autorización operativa deberán ser estados separados.

## D-024 — WhatsApp propio por Organization

**Estado:** ACCEPTED

**Decisión:** Cada organización podrá conectar su propia integración de WhatsApp.

**Motivo:** Los mensajes deben salir bajo la operación del revendedor correspondiente.

**Consecuencias:** Credenciales, configuración, plantillas y destinos deberán pertenecer al tenant.

## D-025 — Automatizaciones aisladas por Organization

**Estado:** ACCEPTED

**Decisión:** Las automatizaciones de un tenant estarán aisladas de las demás organizaciones.

**Motivo:** Evitar cruces de destinatarios, credenciales, contenido o historial.

**Consecuencias:** Jobs, eventos, logs, reintentos y callbacks deberán conservar y validar el contexto de organización.

## D-026 — n8n como orquestador, no fuente de verdad

**Estado:** ACCEPTED

**Decisión:** n8n podrá utilizarse como motor/orquestador, pero no será la fuente de verdad del dominio.

**Motivo:** Mantener integridad y control del negocio dentro de Island Play.

**Consecuencias:** n8n consumirá eventos o comandos; el estado autoritativo permanecerá en la aplicación y PostgreSQL.

## D-027 — Dominio central responsabilidad de Island Play

**Estado:** ACCEPTED

**Decisión:** Ventas, inventario, finanzas, clientes y vencimientos seguirán siendo responsabilidad de Island Play.

**Motivo:** Son el núcleo funcional y requieren consistencia transaccional y trazabilidad.

**Consecuencias:** Las integraciones externas no podrán sustituir el modelo de dominio ni escribir estados críticos sin validación de la aplicación.

## D-028 — Mantenibilidad y evolución como prioridad

**Estado:** ACCEPTED

**Decisión:** La arquitectura priorizará mantenibilidad y evolución.

**Motivo:** El producto debe incorporar tenancy, billing y automatización sin acumular acoplamiento difícil de revertir.

**Consecuencias:** Se favorecerán límites de módulo, contratos explícitos, pruebas y decisiones documentadas.

## D-029 — No migrar prematuramente a microservicios

**Estado:** ACCEPTED

**Decisión:** Island Play no migrará a microservicios de forma prematura.

**Motivo:** La escala y complejidad actuales no justifican el costo operativo de sistemas distribuidos.

**Consecuencias:** La transformación se realizará dentro del despliegue full-stack existente mientras siga siendo adecuado.

## D-030 — Monolito modular con separación futura posible

**Estado:** ACCEPTED

**Decisión:** La dirección preferida es un monolito modular que permita separar servicios si aparece una razón real.

**Motivo:** Obtener límites claros y mantenibilidad sin asumir desde ahora complejidad distribuida.

**Consecuencias:** Los módulos deberán tener responsabilidades y contratos identificables; una extracción futura se evaluará mediante evidencia de escala, riesgo u operación.

## Decisiones todavía no tomadas

Los siguientes temas permanecen deliberadamente abiertos y no forman parte de las decisiones aceptadas anteriores:

- modelo Prisma definitivo de `Organization`, identidad, membresía, plan y suscripción;
- estrategia exacta de aislamiento adicional en PostgreSQL;
- mecanismo de cifrado y custodia de credenciales de streaming;
- modelo definitivo de venta, renovación, ledger y asignación de costos;
- proveedor de OAuth/autenticación y combinación final de métodos;
- duración y reglas exactas del trial;
- pasarela o pasarelas de pago, monedas e impuestos;
- proveedor de WhatsApp y topología de n8n;
- política de soporte excepcional del SuperAdmin;
- estrategia exacta de backups, observabilidad y recuperación.
