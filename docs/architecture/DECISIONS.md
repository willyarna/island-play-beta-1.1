# Decisiones arquitectónicas y de producto confirmadas

## Propósito

Este documento registra las decisiones confirmadas por el propietario después de revisar la auditoría AS-IS. Todas tienen estado `ACCEPTED`.

No define todavía el modelo Prisma definitivo, la pasarela de pago, el proveedor de WhatsApp ni tareas de implementación. La dirección criptográfica inicial ya fue aprobada, pero su representación física y su implementación requieren trabajo posterior.

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

## D-031 — `Account.password` es un secreto recuperable

**Estado:** ACCEPTED

**Decisión:** La contraseña de una cuenta de streaming se tratará como secreto recuperable, se protegerá mediante cifrado reversible autenticado y no usará hashing irreversible.

**Motivo:** Island Play debe poder entregar y volver a entregar la credencial actualmente válida al cliente final.

**Consecuencias:** El plaintext solo podrá recuperarse en operaciones explícitas y autorizadas.

## D-032 — `Profile.pin` es una credencial sensible

**Estado:** ACCEPTED

**Decisión:** El PIN de perfil se cifrará siguiendo el mismo principio de protección y minimización que `Account.password`.

**Motivo:** El PIN forma parte del acceso que se entrega al cliente final.

**Consecuencias:** Listados y DTOs normales tampoco deberán contener PIN ni material criptográfico relacionado.

## D-033 — `Account.email` permanece inicialmente en plaintext

**Estado:** ACCEPTED

**Decisión:** El email o usuario de la cuenta permanecerá inicialmente en plaintext y se tratará como dato privado del tenant, no como secreto criptográfico en esta primera versión.

**Motivo:** Participa en identificación, búsqueda, ordenamiento y selección de cuentas.

**Consecuencias:** No se expondrá a otros tenants ni a SuperAdmin; su posible cifrado futuro podrá reevaluarse.

## D-034 — AES-256-GCM como contrato criptográfico inicial

**Estado:** ACCEPTED

**Decisión:** Las credenciales recuperables se cifrarán server-side con AES-256-GCM mediante APIs de Node.js, nonce aleatorio único de 96 bits y tag de autenticación de 128 bits.

**Motivo:** Se requiere confidencialidad e integridad autenticada con una solución apropiada para el monolito actual.

**Consecuencias:** La lectura fallará cerrada ante manipulación de ciphertext, nonce, tag o AAD, versión desconocida o clave incorrecta. AES-GCM no requiere salt, pero sí nonce único.

## D-035 — Claves separadas por entorno

**Estado:** ACCEPTED

**Decisión:** Development/local, staging y production utilizarán claves diferentes y no compartirán capacidad de descifrado.

**Motivo:** Un incidente o acceso legítimo en un entorno no debe comprometer datos de otro.

**Consecuencias:** Claves, pruebas, backups y procedimientos de recuperación deberán conservar la separación entre entornos.

## D-036 — Custodia inicial desacoplada mediante `KeyProvider`

**Estado:** ACCEPTED

**Decisión:** La custodia inicial usará una variable sensible del entorno de despliegue y el código accederá a las versiones de clave mediante una abstracción conceptual `KeyProvider`, sin depender directamente de Vercel.

**Motivo:** Resolver el riesgo actual con complejidad proporcionada y preservar la posibilidad de cambiar el origen de las claves.

**Consecuencias:** DTOs, UI y autorización no dependerán del proveedor de claves. En Vercel, la variable deberá configurarse como sensitive environment variable.

## D-037 — KMS y envelope encryption quedan diferidos

**Estado:** ACCEPTED

**Decisión:** No se implementarán todavía KMS ni envelope encryption, pero la arquitectura quedará preparada para adoptar AWS KMS, Google Cloud KMS u otro sistema equivalente.

**Motivo:** El estado y escala actuales no justifican aún esa complejidad operativa.

**Consecuencias:** La decisión se reevaluará ante crecimiento, nuevos operadores, requisitos regulatorios o empresariales o un modelo de amenazas más exigente.

## D-038 — Payload cifrado autocontenido y AAD estable como dirección conceptual

**Estado:** ACCEPTED

**Decisión:** Se prefiere conceptualmente un formato autocontenido de credencial cifrada: `encryptedPayload` acompañado por `keyVersion`. El AAD inicial identificará tipo de registro, ID, campo y versión de formato, sin depender de `organizationId`.

**Motivo:** El payload cifrado autocontenido reduce estados parciales y el AAD vincula el secreto a su contexto estable sin acoplarse a un modelo multi-tenant aún inexistente.

**Consecuencias:** Los nombres, tipos y schema Prisma definitivos permanecen abiertos; la clave nunca se almacenará en PostgreSQL. Este formato no es *envelope encryption* mediante DEK/KEK; esa adopción sigue diferida por D-037.

## D-039 — Minimización de exposición y DTOs sin secretos

**Estado:** ACCEPTED

**Decisión:** Bootstrap, listados, filtros, reportes, navegación y DTOs normales no devolverán password, PIN ni material criptográfico. Crear o reemplazar un secreto podrá recibirlo, pero la respuesta normal no lo devolverá.

**Motivo:** Cifrar la base no evita la exposición si todas las credenciales se descifran y distribuyen al navegador.

**Consecuencias:** Editar, asignar o liberar perfiles no reenviará la contraseña; las consultas usarán selecciones y DTOs explícitos.

## D-040 — Revelado explícito, mínimo y autorizado

**Estado:** ACCEPTED

**Decisión:** Las credenciales se revelarán mediante una operación server-side explícita para una cuenta y, cuando corresponda, un perfil concretos.

**Motivo:** El plaintext solo debe existir ante una necesidad operativa identificable.

**Consecuencias:** El flujo contemplará sesión, autorización, propósito, rate limiting, CSRF/origin, `no-store`, auditoría, logging seguro y estado efímero en frontend. MFA o reautenticación adicional quedan para una etapa futura.

## D-041 — SuperAdmin denegado en operaciones de credenciales

**Estado:** ACCEPTED

**Decisión:** SuperAdmin no podrá revelar credenciales y no existirá break-glass en la primera versión.

**Motivo:** SuperAdmin pertenece al control plane, no a la operación privada del tenant.

**Consecuencias:** `control-plane` y `tenant-operations` tendrán contratos separados; las APIs administrativas no reutilizarán DTOs sensibles ni dependerán normalmente del servicio de credenciales.

## D-042 — Sin exportación masiva inicial de credenciales

**Estado:** ACCEPTED

**Decisión:** Las exportaciones normales no contendrán password ni PIN y no se implementará inicialmente una exportación masiva sensible.

**Motivo:** Un archivo con todas las credenciales en plaintext anularía gran parte de la reducción de riesgo conseguida.

**Consecuencias:** Una futura exportación sensible requerirá una nueva decisión de arquitectura y producto.

## D-043 — Entrega inicial manual segura

**Estado:** ACCEPTED

**Decisión:** Después de una venta o asignación, el revendedor podrá generar una entrega inicial explícita con los datos necesarios para ese servicio y perfil.

**Motivo:** Entregar el acceso al cliente final es una capacidad central del producto.

**Consecuencias:** Solo se descifrará la asignación concreta y el plaintext generado se tratará como efímero.

## D-044 — Reentrega con la credencial actualmente válida

**Estado:** ACCEPTED

**Decisión:** El revendedor podrá reenviar los datos de una asignación activa, utilizando las credenciales actualmente válidas y no una copia histórica de la entrega original.

**Motivo:** Las contraseñas y PIN pueden cambiar después de la venta.

**Consecuencias:** La reentrega resolverá cliente, servicio, asignación, cuenta y perfil sin cargar todas las credenciales del inventario.

## D-045 — Separación conceptual entre venta, asignación, credencial y entrega

**Estado:** ACCEPTED

**Decisión:** `Sale`, `Assignment`, `Credential` y `Delivery` serán conceptos distintos aunque todavía no se definan sus entidades finales.

**Motivo:** Qué se vendió, qué está asignado, cuál es el acceso vigente y qué se comunicó tienen ciclos de vida diferentes.

**Consecuencias:** El modelo Prisma definitivo se diseñará después sin usar mensajes históricos como fuente de credenciales.

## D-046 — Historial de entregas sin secretos

**Estado:** ACCEPTED

**Decisión:** El historial registrará que ocurrió una entrega o reentrega, pero no almacenará password, PIN, ciphertext, plaintext revelado ni una copia persistente del mensaje completo cuando contenga secretos. El registro mínimo interno de seguridad y auditoría estará disponible en BASIC y PREMIUM.

**Motivo:** La auditoría necesita metadatos y resultado, no duplicar el secreto.

**Consecuencias:** Un concepto equivalente a `DeliveryEvent` podrá relacionar tipo o acción (`initial`, `resend` o equivalente), actor, cliente cuando aplique, asignación cuando aplique, referencia no secreta de cuenta/perfil, canal, resultado, fecha, request/event ID cuando aplique y, a futuro, organización. El formato y los enums definitivos permanecen TBD.

## D-047 — Plantillas e instrucciones configurables por `Organization`

**Estado:** ACCEPTED

**Decisión:** Las plantillas, instrucciones de uso y condiciones de garantía serán configurables por organización y almacenarán variables, no credenciales reales.

**Motivo:** Cada revendedor define sus propias condiciones; no son una política global hardcodeada de Island Play.

**Consecuencias:** El mensaje con secretos se renderizará solo al entregar. Las entidades definitivas permanecen TBD.

## D-048 — Entrega manual en BASIC y automatización en PREMIUM

**Estado:** ACCEPTED

**Decisión:** BASIC incluirá entrega inicial y reentrega manual seguras, revelado, generación/copia del mensaje, instrucciones configurables y auditoría interna mínima de entrega. PREMIUM podrá añadir envíos automáticos, reintentos, estados avanzados, historial visible avanzado, filtros, dashboards, métricas y orquestación.

**Motivo:** La seguridad, incluida la auditoría mínima, es común a todos los planes; la automatización y la visibilidad avanzada aportan el valor diferencial Premium.

**Consecuencias:** Ningún control esencial de protección de credenciales dependerá del plan contratado.

## D-049 — Entregas externas explícitas y minimizadas

**Estado:** ACCEPTED

**Decisión:** WhatsApp y futuras automatizaciones solo recibirán el plaintext mínimo durante una entrega explícita. No se insertarán automáticamente credenciales en URLs desde listados generales y n8n no almacenará secretos salvo necesidad diseñada y protegida.

**Motivo:** Los proveedores externos amplían la superficie de exposición.

**Consecuencias:** Island Play seguirá siendo fuente de verdad y el usuario conocerá cuándo genera, copia o envía información sensible.

## D-050 — Migración expand → migrate → contract, primero en staging

**Estado:** ACCEPTED

**Decisión:** Las credenciales existentes se migrarán mediante expansión compatible, dual read temporal, backfill idempotente y verificable, transición encrypted-only y contracción posterior separada. Todo se ensayará primero en Neon staging.

**Motivo:** La transformación debe ser recuperable, observable y segura frente a concurrencia.

**Consecuencias:** Production requerirá backup/restauración verificados, pruebas de negocio, entrega, reentrega y rollback o forward recovery exitosos en staging.

## D-051 — Rotación versionada y recifrado progresivo

**Estado:** ACCEPTED

**Decisión:** Cada secreto identificará su versión de clave; habrá una versión activa, lectura temporal de versiones anteriores y recifrado progresivo con nonce nuevo.

**Motivo:** Las claves deben poder rotarse sin indisponibilidad ni pérdida de acceso a datos vigentes.

**Consecuencias:** Una clave anterior no se retirará mientras existan datos activos que dependan de ella. Ante compromiso también se cambiarán las credenciales externas si el plaintext pudo conocerse.

## D-052 — Logging de credenciales por allowlist

**Estado:** ACCEPTED

**Decisión:** Logs, errores y auditoría registrarán metadatos allowlisted y nunca plaintext, bodies sensibles completos ni mensajes de entrega con credenciales.

**Motivo:** El logging no debe convertirse en un almacén alternativo de secretos.

**Consecuencias:** Proveedor, formato y retención definitivos de observabilidad permanecen TBD.

## D-053 — Retirada de credenciales demo embebidas

**Estado:** ACCEPTED

**Decisión:** Login, seed, documentación y scripts no contendrán una credencial administrativa demo conocida. Staging y production se revisarán sin probar la contraseña conocida; si la identidad existe, se rotará o eliminará y se revocarán sus sesiones mediante un procedimiento autorizado.

**Motivo:** Una credencial publicada en código o documentación deja de ser secreta y no debe proteger entornos reales.

**Consecuencias:** Smokes usarán variables exclusivas de testing. Reescribir todo el historial Git no será requisito después de neutralizar la credencial, salvo decisión posterior.

## D-054 — Capacidad inicial de BASIC como entitlement por organización

**Estado:** ACCEPTED

**Decisión:** BASIC tendrá inicialmente el entitlement conceptual `maxActiveCustomers = 100` por `Organization`. Un cliente final activo es un `Customer` que tiene al menos una asignación o servicio actualmente activo. El conteo es de clientes finales únicos: varios servicios del mismo cliente cuentan una sola vez.

**Motivo:** La capacidad comercial debe corresponder al uso operativo real, no a usuarios de Island Play, registros históricos, servicios, cuentas, perfiles o ventas.

**Consecuencias:** Un `Customer` histórico sin servicios activos no cuenta ni debe eliminarse. Renovar un cliente ya activo no incrementa el conteo y seguirá permitido en el límite. La capacidad pertenecerá al futuro concepto de plan/entitlement, no a reglas `if plan` dispersas.

## D-055 — Aplicación no destructiva de la capacidad comercial

**Estado:** ACCEPTED

**Decisión:** Al alcanzar el entitlement de BASIC, solo se rechazará la operación que incremente clientes finales activos por encima del límite: de 99 a 100 se permite; de 100 a 101 se deniega y se orienta hacia PREMIUM. No se eliminarán, ocultarán, suspenderán ni secuestrarán datos existentes.

**Motivo:** Un límite comercial no debe interrumpir la operación ni convertirse en una penalización destructiva para la organización.

**Consecuencias:** En el límite seguirán permitidos login, lectura, gestión de clientes existentes, renovaciones, entrega/reentrega, inventario, facturación, upgrade y operaciones que reduzcan uso. PREMIUM podrá superar la capacidad de BASIC, pero su límite exacto permanece TBD y no se asume ilimitado. Si una organización baja de PREMIUM a BASIC con, por ejemplo, 230 clientes activos, conserva sus datos y puede operar o reducir uso, pero no podrá crecer hasta quedar dentro de su entitlement. La capacidad no altera cifrado, aislamiento, autorización, auditoría mínima ni integridad.

## Decisiones todavía no tomadas

Los siguientes temas permanecen deliberadamente abiertos y no forman parte de las decisiones aceptadas anteriores:

- modelo Prisma definitivo de `Organization`, identidad, membresía, plan y suscripción;
- estrategia exacta de aislamiento adicional en PostgreSQL;
- nombres, tipos y schema Prisma definitivos para credenciales cifradas;
- representación física definitiva del payload cifrado autocontenido y granularidad de una futura envelope encryption;
- proveedor KMS y momento exacto de migración;
- política futura de MFA o reautenticación para revelados;
- formato definitivo de historial de entregas, plantillas e instrucciones;
- política exacta de rate limiting, auditoría, logging y rotación;
- modelo definitivo de venta, renovación, ledger y asignación de costos;
- proveedor de OAuth/autenticación y combinación final de métodos;
- duración y reglas exactas del trial;
- modelos Prisma definitivos de plan, suscripción y entitlement;
- definición técnica exacta y consulta para identificar un `Customer` activo;
- umbrales y mensajes de advertencia previos al límite de capacidad;
- límite exacto de PREMIUM y si podrá comunicarse comercialmente como ilimitado;
- periodos de gracia, UX de upgrade y aplicación de la capacidad durante cambios de plan;
- precio de BASIC y PREMIUM, monedas, proveedor de cobro, enums y mecanismo de feature flag o entitlement;
- pasarela o pasarelas de pago, monedas e impuestos;
- proveedor de WhatsApp y topología de n8n;
- política futura de soporte excepcional del SuperAdmin posterior a la primera versión sin break-glass;
- estrategia exacta de backups, observabilidad y recuperación.
