# Memoria del Proyecto: Larsa Play

Ultima actualizacion: 2026-07-18

## Vision del producto

Larsa Play comenzo como una plataforma para gestionar cuentas de streaming de
forma interna y ahora debe evolucionar a un SaaS vendible para multiples
clientes. El objetivo final es que vendedores de cuentas streaming puedan
comprar un plan, crear su usuario, acceder a su propio panel y gestionar sus
proveedores, servicios, cuentas, perfiles, clientes, vencimientos, pagos,
reportes y automatizaciones.

## Principios importantes

- Responder y documentar siempre en espanol.
- No copiar marcas, logos, assets privados ni codigo de Netfly.
- Mantener equivalencia funcional bajo marca propia: Larsa Play.
- No exponer tokens, cookies, claves, hashes, `DATABASE_URL` ni datos sensibles.
- Validar entradas con Zod en endpoints que aceptan datos.
- Usar sesiones con cookie `httpOnly`.
- Mantener datos separados antes de vender la plataforma a terceros.
- Cualquier cambio desplegable debe pasar por GitHub y Vercel.

## Estado actual

La Beta 1.0 esta desplegada como aplicacion Next.js en Vercel, con base de datos
PostgreSQL en Neon. El repositorio privado de GitHub es:

`https://github.com/willyarna/larsa-play-beta-1.0`

La URL beta desplegada en Vercel es:

`https://larsa-play-beta-1-0-ten.vercel.app`

La base remota usa Neon Postgres. La URL real de conexion no debe guardarse en
documentos ni compartirse por chat; vive como variable `DATABASE_URL` en Vercel
y en la terminal solo durante migraciones/seed.

## Acceso demo

Usuario creado por seed:

- Correo: `admin@larsaplay.local`
- Contrasena inicial: `admin123`

Pendiente antes de comercializar: cambiar contrasena y agregar flujo de cambio
seguro desde el panel.

## Stack tecnico

- Next.js App Router.
- React.
- TypeScript estricto.
- Tailwind CSS.
- PostgreSQL.
- Prisma ORM.
- Zod para validacion runtime.
- bcrypt para hashes de contrasenas.
- Sesiones propias con cookie `httpOnly`.
- Vercel para hosting.
- Neon para base de datos beta.

## Funcionalidades construidas

### Autenticacion

- Login con email y contrasena.
- Sesiones en base de datos.
- Cookie `httpOnly`.
- Hash de token de sesion en BD.
- Logout.

### Landing/login

- Landing page publica de Larsa Play.
- Mensaje comercial enfocado en control operativo y rentabilidad.
- Login integrado en la landing.
- Diseno editorial premium claro/oscuro con alto impacto visual.

### Panel principal

- Navegacion lateral.
- Header con estado de vencimiento, creditos, perfil y salida.
- Ajustes visuales basicos: tema, tamano y color primario.
- Vistas principales: tienda, movimientos, cuentas, clientes, servicios,
  proveedores, conexion, reportes y perfil.

### Servicios/productos

- Crear, editar y eliminar servicios.
- Configurar nombre, perfiles maximos, link e imagen/logo.
- Imagen propia por servicio.
- Los precios/costos ya no se capturan en el servicio: el costo real se define por proveedor/oferta y por cuenta comprada.
- Eliminado logico.
- Acciones de plantillas/notificaciones.

### Proveedores

- Crear, editar y eliminar proveedores.
- Asignar servicios ofrecidos por proveedor con costo por servicio.
- Registrar contacto general.
- Registrar WhatsApp de soporte.
- Registrar WhatsApp de pagos/recargas.
- Accesos directos a WhatsApp desde la tabla de proveedores.
- Exportacion XLSX con contacto, soporte, pagos, servicios y costos.

### Cuentas

- Crear cuentas por servicio.
- Seleccionar proveedor al comprar una cuenta.
- Heredar costo del proveedor/oferta cuando aplica.
- Registrar email, contrasena, observacion, fecha de facturacion y perfiles.
- Asignar clientes a perfiles.
- Marcar perfiles ocupados/libres.
- Ver detalle de cliente/perfil.
- Copiar o notificar datos de cuenta.
- Filtros por servicio, orden y estado de cuentas/perfiles.
- Paginacion y cantidad de filas por pagina.
- Seleccion multiple para eliminacion con validacion: no borrar cuentas con
  perfiles/clientes asignados.
- Colores por vencimiento:
  - 4 dias: amarillo.
  - 2 dias: naranja.
  - 1 o 0 dias: rojo.

### Clientes

- Crear, editar y eliminar clientes.
- Estado activo/inactivo.
- Cliente activo cuando tiene perfil asignado.
- Cliente inactivo cuando no tiene perfiles asignados.
- Acceso directo a WhatsApp.
- Detalle de perfiles asignados.
- Eliminacion individual y multiple.
- Regla: no borrar clientes activos sin liberar/asignaciones primero.
- Importacion/exportacion XLSX.
- Paginacion.

### Movimientos/reportes

- Movimientos de ingresos y egresos.
- Balance basico:
  - Inversion.
  - Ventas.
  - Ganancia.
  - Rentabilidad por cuenta/proveedor.

### WhatsApp/n8n

- Configuracion inicial de conexion.
- Plantillas de mensajes.
- Previsualizacion/copiado de mensajes.
- Accesos directos a WhatsApp.
- Automatizacion real con n8n pendiente para version Premium.

## Infraestructura y backup

### GitHub

- Repositorio privado creado.
- Commit base: `Larsa Play Beta 1.0`.
- Tag base: `v1.0.0-beta`.
- Commit de fix Vercel: `Fix Vercel build scripts`.

### Backup local

Existe un bundle recuperable:

`/run/media/fardsan/Disco_Backup/Codex/Clon Netfly/larsa-play-v1.0.0-beta.bundle`

### Vercel

Variables configuradas:

- `DATABASE_URL`
- `SESSION_COOKIE_NAME=larsa_session`
- `SESSION_COOKIE_SECURE=true`

### Neon

- Proyecto: `larsa-play-beta`.
- Region: AWS US East 1 (N. Virginia).
- Neon Auth apagado.
- Migraciones aplicadas.
- Seed ejecutado correctamente.

## Roadmap SaaS

### Fase 1: Fundacion SaaS multi-cliente

Objetivo: permitir que varios negocios usen Larsa Play sin mezclar datos.

Modelos previstos:

- `Organization`: negocio/empresa cliente.
- `Membership`: relacion entre usuario y organizacion.
- `Plan`: definicion de plan disponible.
- `Subscription`: plan contratado, estado, vencimiento.

Cambios necesarios:

- Agregar `organizationId` a proveedores, servicios, cuentas, perfiles,
  clientes, movimientos y settings.
- Filtrar todas las consultas/API por organizacion actual.
- Crear rol `SUPERADMIN` para administrar todas las organizaciones.
- Crear rol administrador de organizacion para cada cliente.
- Crear seed con superadmin y organizacion demo.
- Migrar datos actuales a una organizacion inicial.

### Fase 2: SuperAdmin

Panel exclusivo para el dueno de Larsa Play:

- Crear organizaciones/clientes de plataforma.
- Crear usuario admin para cada organizacion.
- Activar, pausar o suspender acceso.
- Asignar plan manualmente.
- Definir fecha de vencimiento de suscripcion.
- Ver resumen de clientes SaaS.
- Ver estado de pagos.
- Ver uso por organizacion.
- Entrar en modo soporte si se implementa de forma segura y auditada.

### Fase 3: Planes comerciales

Planes propuestos:

Basico:

- Gestion de clientes.
- Gestion de cuentas.
- Gestion de servicios.
- Gestion de proveedores.
- Reportes basicos.
- Sin automatizaciones.

Pro:

- Todo Basico.
- Reportes avanzados.
- Importacion/exportacion.
- Control de ganancia por proveedor.
- Plantillas avanzadas.

Premium:

- Todo Pro.
- Integracion WhatsApp/n8n.
- Recordatorios automaticos.
- Alertas al vendedor.
- Automatizaciones personalizadas.

### Fase 4: Pagos y self-service

- Landing comercial publica.
- Registro de cliente.
- Checkout de plan.
- Pago directo en plataforma.
- Creacion automatica de organizacion.
- Activacion automatica de plan.
- Renovacion/cancelacion.
- Bloqueo o modo limitado si la suscripcion vence.

Pasarelas posibles a evaluar:

- Stripe si el mercado objetivo y moneda lo permiten.
- Mercado Pago para LATAM.
- Wompi/PayU si se prioriza Colombia.

### Fase 5: Automatizaciones Premium

Arquitectura objetivo:

Larsa Play detecta vencimientos y dispara eventos/webhooks. n8n recibe esos
eventos y ejecuta flujos de WhatsApp/notificaciones.

Automatizaciones:

- Aviso al cliente cuando su servicio esta por vencer.
- Aviso al vendedor cuando un cliente esta por vencer.
- Mensajes segmentados por servicio.
- Registro de intento/envio.
- Reintentos y estado de entrega si el proveedor WhatsApp lo soporta.

## Riesgos pendientes

- Falta multi-tenant: aun no vender a terceros con datos reales mezclados.
- Falta SuperAdmin.
- Falta cambio de contrasena desde UI.
- Falta recuperacion de contrasena.
- Falta auditoria de acciones.
- Falta integracion real de pagos.
- Falta automatizacion real n8n/WhatsApp.
- Falta politicas de privacidad/terminos si se comercializa.
- Falta hardening de produccion antes de clientes reales.

## Siguiente paso recomendado

Crear una carpeta local limpia clonada desde GitHub y trabajar desde ahi. La
carpeta original tiene una carpeta `.git` invalida por restricciones del disco,
asi que para desarrollo continuo conviene clonar el repo en una ubicacion con
Git normal.

Despues iniciar `v1.1.0-saas-foundation` con:

1. `Organization`.
2. `Membership`.
3. `UserRole.SUPERADMIN`.
4. `Plan` y `Subscription`.
5. Migracion de datos actuales a organizacion inicial.
6. Filtros por organizacion en todas las APIs.
