# Arquitectura AS-IS de Island Play

## Estado oficial

**Beta mononegocio funcional. No preparada aún para onboarding SaaS multi-tenant.**

Este documento describe lo que puede comprobarse en el repositorio actual. Las decisiones futuras aceptadas se registran por separado en `DECISIONS.md` y no deben confundirse con funcionalidades ya implementadas.

## Alcance y evidencia

La descripción se basa en:

- `package.json` y `package-lock.json`;
- `src/app`, `src/components`, `src/lib` y `src/types`;
- `prisma/schema.prisma`, seed y migraciones;
- configuración y scripts versionados;
- documentación histórica existente.

No se inspeccionó el contenido de bases remotas ni configuraciones privadas de Vercel, Neon, GitHub o n8n.

## Stack

| Área | Tecnología actual | Responsabilidad |
| --- | --- | --- |
| Aplicación | Next.js App Router | Página, Server Components y Route Handlers |
| UI | React | Panel interactivo y modales |
| Lenguaje | TypeScript estricto | Aplicación, APIs, Prisma seed y DTOs |
| Estilos | Tailwind CSS 4 + CSS propio | Utilidades, temas, layout y componentes visuales |
| Persistencia | PostgreSQL | Base relacional |
| ORM | Prisma 6 | Modelo, migraciones y queries |
| Validación | Zod 4 | Validación de cuerpos de endpoints principales |
| Password de usuario | bcryptjs | Hash y comparación |
| Sesión | Cookie `httpOnly` + token opaco | Autenticación persistida en PostgreSQL |
| Iconos | lucide-react | Iconografía |
| Automatización de navegador | Playwright | Scripts manuales de smoke y capturas |
| Entorno local | Docker Compose | PostgreSQL 17 local |

Las versiones exactas resueltas se encuentran en `package-lock.json`. El repositorio no fija una versión de Node mediante `engines`, `.nvmrc` o `.node-version`; la versión resuelta de Next.js requiere Node `>=20.9.0`.

## Mapa del repositorio

```text
src/
├── app/
│   ├── layout.tsx        layout raíz y metadata
│   ├── page.tsx          autenticación y bootstrap server-side
│   ├── globals.css       Tailwind y estilos propios
│   └── api/              Route Handlers
├── components/
│   ├── AppShell.tsx      panel y lógica interactiva principal
│   ├── LoginForm.tsx     landing y login
│   ├── Logo.tsx
│   └── ProductBadge.tsx
├── lib/
│   ├── api.ts            respuestas y errores JSON
│   ├── money.ts          formato/conversión monetaria
│   ├── prisma.ts         Prisma Client singleton
│   ├── security.ts       tokens, cookie y usuario actual
│   └── validation.ts     schemas Zod
└── types/app.ts          tipos enviados al cliente

prisma/
├── schema.prisma
├── seed.ts
└── migrations/

scripts/                 smoke, capturas y publicación
docs/                    arquitectura, decisiones e historial
public/                  assets propios de Island Play
```

`AppShell.tsx` y `globals.css` concentran gran parte del comportamiento y del diseño. `styles.css` e `index.html` de la raíz no están conectados a la aplicación Next.js actual.

## Arquitectura de ejecución

```text
Browser
  │
  ├── LoginForm
  │     └── POST /api/auth/login
  │
  └── AppShell (Client Component)
        ├── estado local de módulos
        ├── fetch /api/*
        ├── localStorage para tema/plantillas
        └── enlaces manuales a WhatsApp

Next.js
  │
  ├── page.tsx (Server Component)
  │     ├── getCurrentUser
  │     ├── consultas Prisma directas
  │     └── initialData serializado al cliente
  │
  └── Route Handlers
        ├── requireUser
        ├── Zod/validación manual
        └── Prisma

PostgreSQL
```

Características:

- usa App Router;
- existe una única página real, `/`;
- el acceso autenticado y la landing comparten esa ruta;
- no existe middleware;
- la navegación del dashboard cambia un estado `view`, no la URL;
- la página inicial carga en paralelo los principales datos y los hidrata en `AppShell`;
- las actualizaciones posteriores usan Route Handlers y vuelven a consultar colecciones completas.

## Modelo de datos actual

### Identidad

- `User`: nombre, email único, `passwordHash`, rol, estado, `accessUntil`, timestamps y soft delete.
- `Session`: hash único de token, usuario, expiración y creación. La relación con usuario usa `onDelete: Cascade`.

### Proveedores y catálogo

- `Provider`: contacto, WhatsApp de soporte/pago, notas, ofertas, cuentas y una relación legacy con productos.
- `ProviderOffer`: costo de un producto para un proveedor, estado activo y soft delete.
- `Product`: servicio/plataforma, enlace, imagen, color, precio/costo legacy, máximo de perfiles y estado.
- `Combo`: plantilla de catálogo con productos, precio y costo de referencia.
- `ComboItem`: unión única entre combo y producto.

### Inventario y clientes

- `Account`: cuenta madre de un producto, proveedor opcional, credenciales, facturación, costo de compra, visibilidad y soft delete.
- `Profile`: cupo de una cuenta, cliente opcional, PIN, vencimiento, valor vendido y estado.
- `Client`: contacto, estado y soft delete.

### Finanzas y configuración

- `Movement`: ingreso o gasto con concepto libre, monto y fecha; no tiene relaciones de dominio.
- `Setting`: registro singleton `default` para créditos, acceso, WhatsApp, n8n, recordatorios y plantilla.

### Relaciones principales

```text
User ──< Session

Provider ──< ProviderOffer >── Product
Provider ──< Account
Product ──< Account ──< Profile >── Client
Product ──< ComboItem >── Combo

Movement       sin relaciones
Setting        singleton global
```

### Eliminación e historial

- User, Provider, ProviderOffer, Product, Combo, Account, Client y Profile tienen `deletedAt`.
- La aplicación aplica soft delete en varias rutas, pero el comportamiento no es uniforme.
- Editar una cuenta borra físicamente sus perfiles y los recrea.
- Editar un proveedor borra físicamente sus ofertas y las recrea.
- Editar un combo hace lo mismo con `ComboItem`.
- Los movimientos se eliminan físicamente.
- No existen tablas de auditoría ni historial de precios/ventas.

### Migraciones actuales

1. Migración inicial con identidad, dominio, movimientos y settings.
2. Máximo de perfiles por producto.
3. Ofertas proveedor-producto y backfill desde el modelo legacy.
4. Contactos WhatsApp de proveedor.
5. Catálogo de combos.

## Autenticación y sesiones

```text
Formulario
  → POST /api/auth/login
  → Zod
  → User por email
  → estado ACTIVE
  → bcrypt.compare
  → token aleatorio de 32 bytes
  → SHA-256 guardado en Session
  → token original en cookie httpOnly
  → getCurrentUser en solicitudes posteriores
```

La cookie es `httpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. Las sesiones duran 30 días. Logout elimina la sesión actual y expira la cookie.

Limitaciones:

- `accessUntil` no se aplica al autorizar acceso;
- `deletedAt` del usuario no se comprueba;
- no existe registro, OAuth, recuperación o verificación de correo;
- cambio de contraseña y listado/cierre de sesiones son UI simulada;
- no existe rate limiting de login;
- las sesiones expiradas no se limpian automáticamente.

## Autorización

La autenticación responde “quién eres”; la autorización debería responder “qué puedes hacer”. Solo la primera está implementada.

Todos los endpoints operativos llaman `requireUser()`, pero ninguno usa `user.role`. `ADMIN` y `USER` tienen acceso equivalente a todos los datos y mutaciones. Tampoco hay ownership por usuario ni organización.

## Módulos actuales

| Módulo | Estado real |
| --- | --- |
| Login/logout/sesión | Implementado básico |
| Clientes | CRUD, detalle, WhatsApp, importación/exportación y borrado condicionado |
| Servicios | CRUD, imagen, enlace y máximo de perfiles |
| Proveedores | CRUD, contactos y múltiples ofertas por producto |
| Cuentas | CRUD, filtros, perfiles, costos y borrado condicionado |
| Perfiles | Asignación, liberación, PIN, vencimiento y precio vendido |
| Venta individual | Flujo transaccional con inventario existente o cuenta nueva |
| Combos | Catálogo y venta transaccional, con conceptos mezclados |
| Finanzas | Movimientos editables y reportes básicos |
| Settings | API singleton sin UI conectada |
| WhatsApp | Plantillas, preview, copia y apertura manual |
| Perfil/plan/sesiones | Mayormente presentación simulada |

## Venta individual

El endpoint valida producto y cliente dentro de una transacción Prisma.

Con stock existente:

1. comprueba perfil, cuenta y producto;
2. rechaza un perfil ocupado por otro cliente;
3. asigna cliente, nombre, PIN, vencimiento y `soldCents`;
4. activa al cliente;
5. crea un ingreso solo si el nuevo `soldCents` supera el valor anterior.

Con cuenta nueva:

1. exige email y contraseña de cuenta;
2. crea la cuenta y `maxProfiles` perfiles;
3. asigna el primer perfil al cliente;
4. registra el gasto de compra y el ingreso de venta cuando son mayores a cero.

No existe una entidad `Sale` o `Renewal`. La operación queda representada por el estado actual del perfil y por movimientos de texto libre. Las consultas de entrega ocurren después del commit, por lo que un error posterior podría producir una respuesta fallida aunque la venta ya exista.

## Combos

`Combo` representa una plantilla de catálogo y `ComboItem` enumera sus productos. No existe una entidad persistente para una venta concreta de combo.

La venta permite, por cada servicio:

- elegir un perfil libre; o
- crear una cuenta nueva;
- asignar fecha general o fecha diferente;
- distribuir el precio total entre servicios;
- registrar gastos de cuentas nuevas y un ingreso global.

Limitaciones confirmadas:

- no se conserva una relación estructurada entre venta, combo y cliente;
- el nombre del combo solo queda dentro del concepto del movimiento;
- el backend verifica pertenencia de cada producto, pero no igualdad exacta del conjunto;
- no verifica que los importes de ítems sumen el precio total;
- costos enviados por el navegador no son snapshots server-side confiables;
- existe otra UI de asignación de perfiles que etiqueta una operación como combo sin crear una venta combo;
- hay presets hardcodeados no utilizados y costos de referencia hardcodeados sí utilizados.

Actualmente se mezclan catálogo, prorrateo, inventario y venta concreta.

## Finanzas

`Movement` admite `INCOME` y `EXPENSE`, un concepto, monto y fecha. Los movimientos pueden surgir de compras de cuentas, ventas, combos o registro manual.

El sistema puede sumar ingresos, gastos y balance. También puede aproximar rentabilidad por cuenta desde `Account.purchaseCents` y la suma actual de `Profile.soldCents`.

No puede garantizar rentabilidad histórica por cliente, producto, proveedor, combo o venta porque:

- `Movement` no tiene relaciones;
- los perfiles son estado actual, no historial;
- diferentes pantallas generan movimientos con reglas distintas;
- los movimientos son editables y eliminables;
- reportes y conceptos dependen de texto libre.

## Settings, WhatsApp y automatizaciones

`Setting` es global y singleton. Contiene créditos, acceso, estado WhatsApp, webhook n8n, días de recordatorio y una plantilla.

Existen dos sistemas de plantillas desconectados:

1. `Setting.template` en PostgreSQL, usado por el endpoint de preview;
2. biblioteca moderna en `localStorage`, usada por el panel para entrega y recordatorios.

Estado de capacidades:

| Capacidad | Estado |
| --- | --- |
| Copiar mensajes | Implementado |
| Abrir WhatsApp con texto | Implementado |
| Preview backend | Implementado |
| QR/conexión real | Placeholder |
| Scheduler/cron | No implementado |
| Queue/worker | No implementado |
| Invocación n8n | No implementada |
| Retry | No implementado |
| Log/estado de envío | No implementado |
| Configuración por tenant | No implementada |

## Seguridad

### Controles existentes

- bcrypt para contraseñas de usuarios;
- token de sesión criptográficamente aleatorio;
- hash del token en PostgreSQL;
- cookie `httpOnly` y `Secure` en producción;
- Prisma sin SQL raw;
- escape estándar de React y ausencia de `dangerouslySetInnerHTML`;
- validación Zod para cuerpos principales;
- cabeceras `nosniff`, `DENY`, Referrer Policy y Permissions Policy;
- `.env` y artefactos locales ignorados.

### Riesgos confirmados

- las contraseñas de streaming se almacenan en texto plano;
- se envían al navegador y aparecen en APIs, tablas, exportaciones y mensajes;
- existe una credencial administrativa demo embebida en seed/formulario/documentación histórica;
- no hay autorización por rol ni tenant;
- no hay rate limiting, CSP, auditoría de accesos o protección CSRF explícita;
- varios endpoints de borrado y query params usan casts manuales, no Zod;
- varias respuestas usan objetos Prisma sin DTO explícito;
- imágenes de producto se almacenan como strings grandes sin validación de tipo real.

No se encontraron secretos reales versionados en el árbol actual. La configuración efectiva de seguridad de los proveedores externos no puede determinarse desde el repositorio.

## Fechas y vencimientos

Las fechas civiles llegan como `YYYY-MM-DD` y normalmente se convierten con `T00:00:00`. El timezone mostrado en perfil no se persiste ni gobierna cálculos.

`daysLeft` limita el resultado mínimo a cero. Como consecuencia:

- una fecha pasada y una fecha de hoy son indistinguibles;
- el dashboard cuenta perfiles vencidos también como “hoy”;
- vencimientos antiguos pueden seguir apareciendo en la lista urgente como cero días.

La futura operación internacional necesita una política explícita de fecha civil, timezone y moneda por organización.

## Responsive

El componente incluye breakpoints Tailwind y `globals.css` contiene media queries. Sin embargo, al final del archivo se vuelven a imponer con `!important` el grid de escritorio, el ancho del sidebar, la altura de topbar y el padding del workspace. Estas reglas aparecen después de las correcciones móviles y prevalecen en pantallas pequeñas.

Las tablas mantienen anchos mínimos cercanos a 930–980 px; la navegación no tiene menú móvil colapsable; algunos controles y resúmenes usan anchos mínimos/fijos. Esto explica sidebar dominante, navegación desbordada, controles comprimidos y tablas fuera del viewport.

## Testing

- El proyecto tiene TypeScript estricto y un script de typecheck.
- Playwright está instalado.
- Existe un smoke manual de login de escritorio.
- Existe un script de capturas de landing; parte de sus selectores corresponde a una versión anterior.
- No existen unit tests, integration tests, tests API, suite E2E formal, cobertura ni workflow CI en el repositorio.
- No hay pruebas de seguridad, autorización, aislamiento, transacciones, concurrencia, fechas o idempotencia.

## Build, deploy e infraestructura

El repositorio contiene scripts de desarrollo, build, start, generación Prisma, migración local/deploy y seed. Docker Compose levanta únicamente PostgreSQL local.

No existen:

- Dockerfile de la aplicación;
- `vercel.json`;
- health endpoint;
- validación fail-fast de entorno;
- workflows CI versionados;
- documentación de rollback o recuperación;
- observabilidad o alertas configuradas en código.

Contexto proporcionado por el propietario, no descubierto en configuración versionada: GitHub → Vercel, Neon production para Production y Neon staging para Preview.

## Estado frente a multitenancy

No existen `Organization`, `Membership`, `tenantId`, `organizationId`, workspace activo ni filtros de tenant. `Setting` es global. Todos los usuarios autenticados operan el mismo conjunto de datos.

Incorporar varios revendedores sin una transformación previa expondría clientes, proveedores, costos, credenciales, ventas y finanzas entre ellos.

## Hallazgos depurados

### P0 — Bloquean comercialización multi-tenant

1. Aislamiento por organización inexistente.
2. Autorización server-side inexistente más allá de autenticación.
3. Contraseñas de streaming en texto plano y expuestas ampliamente.
4. Credencial administrativa demo embebida; el estado real en producción debe verificarse.

### P1 — Necesarios antes del SaaS comercial

1. Aplicar acceso/suscripción a nivel de organización; `accessUntil` actual no bloquea.
2. Formalizar venta, renovación, ítems e idempotencia.
3. Relacionar movimientos financieros con sus orígenes.
4. Cerrar validaciones de integridad y concurrencia en ventas individuales/combos.
5. Sustituir edición destructiva de perfiles.
6. Crear pruebas automatizadas de seguridad, dominio y aislamiento.
7. Completar ciclo de identidad, revocación y rate limiting.
8. Definir rollback, backups, health checks y observabilidad.
9. Diseñar automatizaciones aisladas por organización.

### P2 — Mejoras importantes

1. Corregir fechas, timezone y conteos de vencimiento.
2. Consolidar responsive y cascada CSS.
3. Eliminar la duplicidad/inconsistencia de `Client.status`.
4. Introducir historial de precios y retirar campos legacy de producto.
5. Aplicar Zod y DTOs explícitos en toda la superficie API.
6. Hacer importaciones y seed idempotentes/atómicos.
7. Añadir hardening web: CSP, origen/CSRF y límites de carga.
8. Llevar filtros y paginación al servidor.
9. Retirar o etiquetar capacidades simuladas.

### P3 — Mantenibilidad y evolución

1. Dividir `AppShell.tsx` y `globals.css` por módulos y responsabilidades.
2. Retirar código, constantes, archivos y dependencias no utilizados.
3. Fijar el runtime Node y validar variables de entorno al inicio.

## Conclusión

La base existente debe evolucionarse, no descartarse. Son reutilizables el stack, el esquema relacional inicial, `ProviderOffer`, el patrón de sesión opaca, la validación Zod, las migraciones Prisma, buena parte de los CRUD y la intención transaccional de las ventas.

Requieren rediseño los límites de tenant/autorización, custodia de credenciales, ventas/renovaciones, finanzas, combos, suscripciones, automatizaciones y la composición del frontend.

