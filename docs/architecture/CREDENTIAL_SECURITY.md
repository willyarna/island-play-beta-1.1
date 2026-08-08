# Seguridad de credenciales recuperables

## Estado

**Dirección arquitectónica aprobada. Todavía no implementada.**

Este documento define la política oficial para proteger las credenciales de cuentas de streaming y perfiles en Island Play. No constituye un diseño Prisma definitivo, una migración ejecutable ni autorización para cambiar código, datos o infraestructura.

## 1. Propósito

Island Play necesita conservar credenciales recuperables para que cada revendedor pueda entregar y volver a entregar un servicio a su cliente final. La protección debe combinar cifrado autenticado, autorización server-side y minimización del tiempo y la superficie en que existe plaintext.

Los objetivos son:

- proteger credenciales ante una lectura directa de PostgreSQL o de sus copias;
- evitar que listados y cargas generales distribuyan secretos;
- descifrar únicamente la cuenta y el perfil requeridos por una acción explícita;
- preparar la evolución a SaaS multi-tenant sin acoplar el diseño actual a un modelo que aún no existe;
- mantener una ruta de evolución hacia KMS o envelope encryption sin rediseñar DTOs, UI ni autorización.

## 2. Threat model

El diseño contempla como amenazas principales:

- acceso no autorizado a PostgreSQL, backups o herramientas administrativas;
- exposición accidental mediante respuestas API, bootstrap, objetos Prisma o DTOs demasiado amplios;
- acceso masivo desde el navegador, extensiones, DevTools, XSS futuro o una estación comprometida;
- filtración mediante logs, excepciones, portapapeles, exportaciones o URLs de terceros;
- uso accidental del servicio de credenciales desde el control plane de SuperAdmin;
- reutilización de una clave entre development, staging y production;
- manipulación de ciphertext, nonce, tag, AAD o versión de clave;
- permanencia de credenciales históricas en entregas, automatizaciones o eventos de auditoría.

El cifrado de aplicación reduce el impacto de una lectura de base de datos, pero no protege el plaintext después de una revelación autorizada ni frente a un operador con capacidad de modificar y desplegar código. Una separación de privilegios más fuerte podrá requerir KMS u otra frontera de infraestructura.

## 3. Estado AS-IS

Actualmente `Account.password` y `Profile.pin` se guardan en plaintext. El bootstrap y las APIs de cuentas pueden enviarlos al navegador, `AppShell` los mantiene en memoria y existen usos en tablas, edición, mensajes, portapapeles, exportaciones XLSX y URLs de WhatsApp.

Las APIs están autenticadas, pero todavía no existe autorización por organización ni aislamiento multi-tenant. Tampoco existen auditoría de revelados, rate limiting específico, protección CSRF/origin explícita ni una suite automatizada de seguridad.

Este estado sigue siendo el comportamiento implementado hasta que una fase posterior complete y verifique la migración.

## 4. `User.passwordHash` frente a `Account.password`

Son datos con requisitos distintos:

- `User.passwordHash` autentica a un usuario de Island Play. Su contraseña no necesita recuperarse y debe permanecer protegida mediante hashing irreversible adecuado.
- `Account.password` permite acceder a un servicio de streaming y debe recuperarse legítimamente para una entrega o reentrega. Se trata como secreto recuperable y no se le aplicará hashing irreversible.

La nueva arquitectura de cifrado no sustituye ni modifica el tratamiento conceptual de las contraseñas de usuarios de Island Play.

## 5. Secretos protegidos

Se tratarán como credenciales sensibles:

- `Account.password`;
- `Profile.pin`.

Ambos seguirán el mismo principio de cifrado reversible autenticado y minimización de exposición.

## 6. Datos no cifrados inicialmente

`Account.email` permanecerá inicialmente en plaintext. Es un dato privado del tenant, pero no se clasifica en esta primera versión como secreto criptográfico porque participa en identificación, búsqueda, ordenamiento y selección de cuentas.

Permanecer en plaintext no autoriza su exposición a otros tenants ni a SuperAdmin. La conveniencia de cifrarlo podrá reevaluarse si cambia el modelo de amenazas o los requisitos regulatorios.

## 7. Contrato criptográfico inicial

El algoritmo inicial será AES-256-GCM mediante APIs criptográficas server-side de Node.js.

Cada operación de cifrado deberá usar:

- una clave de 256 bits obtenida mediante `KeyProvider`;
- un nonce aleatorio único de 96 bits;
- un tag de autenticación de 128 bits;
- AAD estable asociado al registro y al campo;
- una versión explícita de clave y de formato.

La operación debe fallar cerrada si se manipula el ciphertext, nonce, tag o AAD, si la clave es incorrecta o si no existe la versión solicitada. No se requiere salt para AES-GCM; sí se requiere que el nonce no se reutilice con la misma clave.

## 8. `KeyProvider`

La primera custodia de claves usará variables sensibles del entorno de despliegue. En Vercel deberán configurarse como sensitive environment variables, pero el código no dependerá directamente de APIs ni tipos de Vercel.

Conceptualmente, `KeyProvider` será responsable de:

- identificar la versión activa;
- entregar material de clave para una versión autorizada;
- conservar temporalmente versiones anteriores durante rotaciones;
- fallar si la versión no existe;
- permitir que el origen futuro sea AWS KMS, Google Cloud KMS, envelope encryption u otro sistema equivalente.

KMS y envelope encryption no se implementarán todavía. Se reevaluarán ante crecimiento, nuevos operadores de infraestructura, obligaciones regulatorias o empresariales, cambios del modelo de amenazas o necesidad de una separación de privilegios más fuerte.

## 9. Separación por entorno

Development/local, staging y production utilizarán claves distintas. Una clave de staging no podrá descifrar production y una clave de production no estará disponible en development.

La configuración, despliegue, backup y recuperación deberán preservar esta separación. Mover ciphertext entre entornos no implica que deba ser descifrable fuera de su entorno original.

## 10. Formato de almacenamiento

La dirección conceptual preferida es almacenar por secreto:

- `encryptedPayload`;
- `keyVersion`.

El payload cifrado autocontenido podrá incorporar internamente:

- versión de formato;
- algoritmo y versión;
- nonce;
- ciphertext;
- tag de autenticación.

Frente a columnas independientes para ciphertext, nonce, tag y versión de formato, el payload cifrado autocontenido reduce combinaciones parciales, facilita validar el paquete como una unidad y permite evolucionar su representación sin agregar una columna por cada detalle. Mantener `keyVersion` accesible facilita seleccionar la clave y localizar datos pendientes de rotación.

Este formato autocontenido de credencial cifrada no debe confundirse con *envelope encryption* mediante DEK/KEK: esa capacidad de gestión criptográfica permanece diferida.

Las columnas independientes serían más fáciles de inspeccionar y consultar, pero aumentan el riesgo de estados incompletos o componentes pertenecientes a operaciones distintas. La elección física final y los nombres Prisma permanecen TBD.

La clave criptográfica nunca se almacenará en PostgreSQL.

## 11. AAD

La primera versión no acoplará el formato a `organizationId`, ya que el modelo multi-tenant aún no existe. El AAD deberá derivarse de valores estables y, como mínimo, poder representar:

```text
tipo de registro | ID del registro | nombre del campo | versión de formato
```

Ejemplos conceptuales, sin valores reales:

```text
Account | account-id | password | format-v1
Profile | profile-id | pin | format-v1
```

Cuando exista `Organization`, se evaluará si una nueva versión de formato/AAD aporta una protección material. No se introduce ahora una migración basada en una entidad inexistente.

## 12. Versionado y rotación de claves

Cada secreto identificará su `keyVersion`. Existirá una versión activa; todos los cifrados nuevos usarán exclusivamente esa versión. El sistema podrá leer versiones anteriores mientras existan datos activos que dependan de ellas.

La rotación será progresiva, utilizará nonce nuevo y recifrará los registros por lotes. Una clave anterior no se retirará hasta demostrar que ningún dato activo la necesita y que se cerró la ventana de rollback correspondiente.

La frecuencia exacta de rotación permanece TBD.

## 13. Minimización de exposición

El cifrado de PostgreSQL no es suficiente. El plaintext solo existirá cuando un flujo explícito lo necesite y durante el menor tiempo posible.

Reglas aceptadas:

- el bootstrap no devolverá passwords ni PIN;
- listados, filtros, reportes y navegación no descifrarán credenciales;
- `GET /api/accounts` no devolverá secretos ni material criptográfico;
- crear o reemplazar una contraseña podrá recibir un secreto nuevo, pero la respuesta normal no lo devolverá;
- editar, asignar o liberar un perfil no exigirá reenviar la contraseña de la cuenta;
- renovar no descifrará credenciales salvo que el operador inicie una entrega o reentrega;
- ventas con inventario existente no descifrarán credenciales durante la transacción;
- el frontend eliminará el plaintext de su estado al terminar la acción o cerrar la vista.

## 14. DTOs seguros

Los DTOs normales de `Account` y `Profile` no contendrán:

- password o PIN;
- ciphertext, nonce o tag;
- `keyVersion` o versión de formato;
- `encryptedPayload`;
- otros detalles criptográficos.

Las consultas deberán usar selecciones explícitas. Los DTOs de revelado serán contratos separados, mínimos y exclusivos de operaciones sensibles. Las respuestas de creación y edición normales tampoco devolverán el secreto recibido.

## 15. Revelado explícito

Las credenciales se obtendrán bajo demanda mediante una operación server-side conceptualmente equivalente a:

```text
POST /api/accounts/{accountId}/credentials/reveal
```

La forma final del endpoint permanece para la implementación. El revelado será de una cuenta concreta y, cuando corresponda, de un perfil concreto.

Requerirá:

- sesión válida;
- autorización server-side;
- denegación explícita a SuperAdmin;
- validación de tenant server-side cuando exista multitenancy;
- propósito explícito;
- rate limiting;
- protección CSRF/origin;
- `Cache-Control: no-store`;
- respuesta mínima;
- auditoría y logging seguro.

La primera versión no tendrá acceso excepcional o break-glass para SuperAdmin ni exigirá MFA o reautenticación adicional. La step-up authentication se reevaluará después de definir OAuth e identidad definitiva.

## 16. Frontera de SuperAdmin

SuperAdmin administra el control plane: Organizations, planes, suscripciones, trials, billing, estados, `ADMIN_GRANT` o cortesías y métricas de plataforma.

No tendrá acceso operativo ordinario a cuentas, passwords, PIN, clientes finales, proveedores, costos, ventas ni finanzas privadas del tenant.

Conceptualmente existirán fronteras entre:

```text
control-plane
tenant-operations
```

Las APIs de SuperAdmin no reutilizarán DTOs sensibles de `Account` o `Profile`, y el servicio de credenciales no será una dependencia normal del control plane. Estos módulos todavía no están implementados.

## 17. Exportaciones

Las exportaciones normales no contendrán password ni PIN. No se implementará inicialmente una exportación masiva de credenciales.

Una futura exportación sensible requerirá una nueva decisión arquitectónica y de producto. El objetivo es evitar que, después de proteger PostgreSQL, la aplicación genere archivos masivos en plaintext.

## 18. Venta, asignación, credencial y entrega

La evolución del dominio deberá separar conceptualmente:

- **Sale:** qué compró el cliente;
- **Assignment:** qué cuenta y perfil están asignados;
- **Credential:** cuál es el acceso actualmente válido;
- **Delivery:** cuándo y por qué canal se comunicó ese acceso.

No se fijan todavía entidades ni schema Prisma. La transacción de venta o asignación no necesita descifrar credenciales salvo que, después de completarse, el operador solicite una entrega.

## 19. Entrega inicial

Después de una venta o asignación, el revendedor podrá iniciar una entrega manual segura. Según el servicio, podrá incluir email/usuario, password, perfil, PIN, servicio, vencimiento, instrucciones y condiciones de garantía.

La generación será explícita y descifrará únicamente la cuenta y el perfil requeridos para esa asignación.

## 20. Reentrega

Un cliente final puede perder sus datos y solicitar que se envíen nuevamente. El flujo permitirá localizar:

```text
Cliente → servicio activo → asignación → cuenta/perfil → Reenviar datos
```

La reentrega no volverá a cargar todo el inventario. Usará las credenciales actualmente válidas de la cuenta y el perfil, no una copia histórica del mensaje original. Por ello, un cambio posterior de contraseña se reflejará en futuras reentregas.

## 21. Historial de entrega

La arquitectura futura permitirá registrar que una entrega ocurrió mediante un concepto equivalente a `DeliveryEvent`. Este registro mínimo interno de seguridad y auditoría estará disponible tanto en BASIC como en PREMIUM; no es una capacidad exclusiva de PREMIUM. Podrá relacionar tipo de acción o evento (`initial`, `resend` o equivalente), actor, `Customer` cuando aplique, `Assignment` cuando aplique, cuenta y perfil como referencias no secretas, canal, fecha, resultado, request/event ID cuando aplique y, en el futuro, `Organization`.

Los canales conceptuales incluyen operación manual, copia, WhatsApp y automatización. Los resultados conceptuales incluyen creación, envío y fallo. Nombres, enums y schema definitivos permanecen TBD.

Reglas críticas:

- el evento no almacena password;
- el evento no almacena PIN;
- el evento no almacena ciphertext ni plaintext revelado;
- no conserva una copia persistente del mensaje completo si contiene secretos;
- registra que la entrega ocurrió, no el secreto entregado.

## 22. Plantillas e instrucciones

Las plantillas almacenan texto y variables conceptuales, nunca valores reales. El mensaje con plaintext se renderiza únicamente durante la entrega y se trata como efímero.

Variables conceptuales posibles:

```text
customerName
serviceName
accountEmail
accountPassword
profileName
profilePin
expiresAt
warrantyRules
```

Las instrucciones de uso no serán una política global hardcodeada de Island Play. Cada `Organization` podrá configurar recomendaciones como uso del perfil asignado, restricciones de cambios o compartición y condiciones de soporte.

Conceptos equivalentes a `DeliveryTemplate`, `ServiceInstructions` o `WarrantyPolicy` podrán evaluarse después; sus entidades definitivas permanecen TBD.

## 23. BASIC y PREMIUM

La seguridad no es una función Premium.

El plan BASIC deberá permitir como mínimo entrega inicial y reentrega manual seguras, generación y copia de mensajes, revelado bajo demanda, instrucciones configurables y el registro interno mínimo de seguridad y auditoría de cada entrega o reentrega.

PREMIUM podrá añadir posteriormente envío automático por WhatsApp, entrega automática posterior a una venta, recordatorios, reenvíos automatizados, historial visible avanzado, filtros, dashboards, métricas, estados avanzados, reintentos, seguimiento avanzado de entrega y orquestación mediante n8n.

La seguridad criptográfica, autorización, aislamiento por organización, auditoría mínima e integridad son comunes a ambos planes. Los límites comerciales de capacidad no deben debilitar esos controles.

## 24. WhatsApp

No se colocarán automáticamente credenciales en URLs de WhatsApp desde listados generales. Una entrega será una acción consciente y explícita, y solo descifrará la cuenta y el perfil requeridos.

La interfaz deberá advertir que se está generando, copiando o enviando información sensible. El diseño futuro minimizará la exposición a proveedores externos y evitará propagar plaintext más allá de lo indispensable.

El proveedor definitivo de WhatsApp permanece TBD.

## 25. n8n

n8n podrá orquestar automatizaciones, pero no será fuente de verdad. Island Play continuará siendo responsable de ventas, clientes, inventario, asignaciones, credenciales, vencimientos y finanzas.

La automatización deberá minimizar el plaintext que atraviesa n8n y evitar su persistencia en workflows, logs o historiales salvo una necesidad específicamente diseñada y protegida. La implementación y topología concretas permanecen TBD.

## 26. Migración expand → migrate → contract

La migración aprobada será recuperable, verificable y dividida en etapas.

### Preparación

- confirmar backup/PITR antes de datos reales;
- verificar mediante ensayo la capacidad de restauración;
- preparar claves diferentes para staging y production;
- definir métricas que no expongan secretos.

### Expand

- agregar posteriormente campos cifrados nullable;
- mantener temporalmente las columnas plaintext legacy;
- desplegar compatibilidad sin contracción destructiva.

### Dual read temporal

- leer primero el formato cifrado;
- usar plaintext solo como fallback para registros legacy;
- limitar esta compatibilidad a una ventana controlada.

### Backfill

- proceso idempotente, reanudable y por lotes;
- cifrado de passwords y PIN existentes;
- protección frente a actualizaciones concurrentes;
- prohibición de imprimir secretos.

### Verificación

- comparar en memoria el valor legacy con el valor descifrado;
- reportar únicamente IDs y conteos de errores;
- detener el proceso ante inconsistencias.

### Encrypted-only y contract

- dejar de escribir plaintext después del backfill y las pruebas;
- desactivar fallback para registros migrados;
- poner el plaintext legacy en `NULL` en una etapa posterior;
- observar la plataforma y cerrar la ventana de rollback;
- eliminar columnas legacy únicamente en una migración futura separada.

Nunca se combinarán expansión y contracción destructiva en la misma migración.

## 27. Staging → production

Todo el proceso se ensayará primero en Neon staging. Production no se tocará hasta completar satisfactoriamente:

- backfill y verificación en staging;
- lecturas y escrituras cifradas;
- venta individual con cuenta nueva y con stock;
- combos con stock y cuentas nuevas;
- entrega inicial y reentrega;
- rollback o forward recovery;
- backup y restauración verificados.

Las claves de staging y production permanecerán separadas durante todo el proceso.

## 28. Respuesta ante compromiso

Ante sospecha o confirmación de compromiso:

1. generar una nueva versión;
2. dejar de usar la versión comprometida para nuevas escrituras;
3. determinar alcance;
4. recifrar progresivamente los registros recuperables con nonce nuevo;
5. revisar logs y auditoría;
6. revocar sesiones afectadas cuando corresponda;
7. solicitar el cambio real de credenciales al proveedor si el plaintext pudo conocerse.

Recifrar una contraseña conocida por un atacante no vuelve segura esa contraseña externa.

## 29. Logging y errores

- nunca registrar plaintext de credenciales;
- no registrar ciphertext salvo necesidad técnica explícita y aprobada;
- no registrar bodies completos de endpoints sensibles;
- usar códigos y mensajes de error allowlisted;
- mantener secretos fuera de stack traces, métricas y contexto estructurado;
- registrar en auditoría únicamente metadatos, propósito, resultado y actor;
- no conservar mensajes completos de entrega cuando contengan secretos.

El proveedor, retención y formato definitivo de logs/auditoría permanecen TBD.

## 30. Credencial administrativa demo

El formulario de login no tendrá credenciales demo precargadas. Seeds y scripts de smoke no incorporarán una contraseña administrativa conocida: los scripts usarán variables exclusivas de testing y los entornos reales tendrán aprovisionamiento controlado.

La documentación activa no contendrá valores literales. Staging y production deberán revisarse por la identidad demo sin probar contra ellos la contraseña conocida. Si existe, se rotará o eliminará y se revocarán sus sesiones mediante un procedimiento autorizado.

Reescribir el historial Git completo no es requisito para neutralizar la credencial después de rotarla, salvo una decisión de seguridad posterior.

## 31. Suite mínima de testing

### Criptografía

- round trip encrypt/decrypt;
- Unicode y límites;
- ciphertext distinto para el mismo plaintext;
- fallo con clave incorrecta;
- fallo al modificar ciphertext, nonce, tag o AAD;
- fallo con `keyVersion` desconocida;
- lectura con una clave anterior;
- escritura exclusiva con la clave activa.

### API y autorización

- listado y bootstrap sin password ni PIN;
- material criptográfico ausente de DTOs;
- creación y edición sin devolver contraseña;
- revelado autorizado y no autorizado;
- SuperAdmin explícitamente denegado;
- respuesta `no-store`;
- protección de origen/CSRF.

### Dominio y entrega

- venta individual con cuenta nueva y con stock;
- combo con stock y cuentas nuevas;
- entrega inicial y reentrega;
- reentrega con la credencial actualmente válida;
- edición de perfil sin retransmitir contraseña.

### Exportación

- exportación normal sin password;
- exportación normal sin PIN.

### Migración y rotación

- registros legacy, cifrados y estado mixto;
- backfill idempotente y reanudable;
- actualización concurrente;
- rotación progresiva;
- rollback y forward recovery.

### Logging e historial

- errores sin password ni PIN;
- auditoría sin secretos;
- evento de entrega sin mensaje sensible.

## 32. Decisiones futuras / TBD

Permanecen deliberadamente abiertas:

- nombres y tipos definitivos de campos Prisma;
- schema Prisma final;
- representación física exacta del payload cifrado autocontenido;
- proveedor KMS y momento de migración;
- uso y granularidad futura de envelope encryption;
- política futura de MFA o reautenticación;
- proveedor de WhatsApp;
- integración y topología de n8n;
- modelo definitivo de venta, assignment y delivery;
- formato definitivo de `DeliveryEvent`;
- entidades definitivas para plantillas, instrucciones y garantía;
- política exacta de rate limiting;
- proveedor de auditoría y logging;
- frecuencia exacta de rotación;
- retención de logs y backups;
- posible cifrado futuro de `Account.email`.

## 33. Elementos no implementados todavía

Este documento no significa que ya existan:

- cifrado AES-256-GCM en la aplicación;
- `KeyProvider`;
- campos cifrados o migraciones Prisma;
- backfill de datos;
- DTOs minimizados;
- endpoint de revelado;
- autorización tenant o denegación técnica a SuperAdmin;
- auditoría, rate limiting o protección CSRF específica;
- entrega inicial/reentrega formalizada;
- historial de entregas;
- plantillas por `Organization`;
- automatización WhatsApp/n8n;
- suite automatizada de pruebas.

El siguiente paso autorizado para diseño e implementación será **B1 — contrato criptográfico + tests**, sujeto a revisión separada.
