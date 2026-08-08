# Auditoría de skills para Island Play

Fecha: 2026-07-23  
Ubicación auditada: `.agents/skills`

## Criterio usado

Island Play necesita skills que ayuden directamente a:

- Construir y mantener una app Next.js + TypeScript + Prisma/PostgreSQL.
- Mejorar diseño, UX, accesibilidad, landing y componentes internos.
- Comercializar la plataforma como SaaS: pricing, onboarding, conversión, retención y medición.
- Preparar futuras automatizaciones de mensajes, WhatsApp/n8n y crecimiento medible.

Las skills de marketing periférico, campañas muy lejanas o canales que no hacen parte del roadmap inmediato se retiraron de la carpeta local activa del proyecto para reducir ruido.

## Skills conservadas

## Skills agregadas después de la segunda revisión

Después de revisar las brechas reales del proyecto con `find-skills`, se agregaron estas skills a `.agents/skills`:

### Estabilidad técnica y calidad

- `database-migrations`: cambios de esquema, migraciones Prisma/Postgres, datos de producción y rollback.
- `debugging-and-error-recovery`: diagnóstico sistemático de errores de servidor, Prisma, Next.js y runtime.
- `docker-patterns`: estabilidad del entorno local con Docker Compose, volúmenes, red y servicios.
- `deployment-patterns`: checklist de despliegue, rollback, health checks y preparación para producción.
- `e2e-testing`: pruebas de punta a punta con Playwright para login, clientes, cuentas, servicios, combos y proveedores.
- `code-review-and-quality`: revisión antes de mergear o subir una versión nueva.
- `frontend-a11y`: accesibilidad visual y de interacción, especialmente importante en formularios y tablas.

### Repositorio, versiones y backups

- `git-workflow-and-versioning`: flujo de versiones beta, tags, ramas y backups seguros.
- `github-ops`: operaciones en GitHub, releases, issues, PRs y administración del repositorio.

### Prisma/Postgres

- `prisma-postgres`: skill oficial de Prisma para PostgreSQL. Relevante para Neon, Prisma Client, migraciones y consultas.

### Monetización y automatizaciones futuras

- `customer-billing-ops`: flujos de suscripción, planes, pagos, renovaciones y operación de clientes.
- `whatsapp-automation`: automatización de WhatsApp. Se usará con cuidado cuando entremos en el módulo premium con n8n/QR/mensajes automáticos.
- `automation-audit-ops`: inventario y auditoría de automatizaciones, webhooks, jobs, conectores y flujos n8n antes de activar o cambiar procesos automáticos.
- `api-and-interface-design`: diseño de contratos estables para APIs, webhooks y DTOs entre Island Play, n8n, WhatsApp, pagos y futuros conectores.
- `api-connector-builder`: creación de conectores siguiendo el patrón interno del proyecto, sin inventar arquitecturas paralelas.
- `mcp-server-patterns`: base para crear futuros servidores MCP de Island Play con herramientas, recursos, prompts, validación Zod y transporte local/remoto.

### Nota de seguridad

`whatsapp-automation` fue instalada porque encaja con el roadmap premium, pero debe revisarse antes de usarla para acciones reales. WhatsApp/n8n implica sesiones, QR, mensajes a clientes y posibles límites/reglas de plataforma.

### Nota sobre n8n y MCP

Se evaluaron opciones de skills específicas para n8n con `find-skills`. La candidata más cercana (`vladm3105/aidoc-flow-framework@n8n`) apareció en la búsqueda, pero al intentar instalarla el instalador no encontró una skill llamada `n8n` dentro de ese repositorio. Por eso no se dejó instalada como dependencia activa.

La estrategia recomendada para Island Play es:

- Usar `whatsapp-automation` para criterios de mensajería, plantillas, límites y buenas prácticas.
- Usar `api-and-interface-design` para definir eventos y contratos estables: vencimiento próximo, cuenta vencida, cliente asignado, pago generado, proveedor actualizado, etc.
- Usar `api-connector-builder` para construir conectores propios hacia n8n o proveedores externos cuando haga falta.
- Usar `automation-audit-ops` antes de activar automatizaciones reales para confirmar qué flujo está configurado, autenticado, verificado, roto o duplicado.
- Usar `mcp-server-patterns` más adelante si queremos que Island Play exponga herramientas MCP, por ejemplo: consultar clientes, listar cuentas vencidas, generar reportes o disparar flujos aprobados desde un agente.

Si n8n se vuelve una parte central del producto premium, conviene crear una skill propia del proyecto, por ejemplo `island-play-n8n-automation`, con nuestros flujos oficiales, convenciones de webhooks, payloads, reintentos, logs y reglas de seguridad.

### Producto, diseño y frontend

- `ui-ux-pro-max`: sistema de estilos, paletas, tipografías, componentes, movimiento y gráficos.
- `web-design-guidelines`: auditoría visual, UX y accesibilidad.
- `vercel-react-best-practices`: buenas prácticas de React/Next.js para rendimiento y despliegue.
- `site-architecture`: navegación, estructura de páginas y arquitectura de información.
- `image`: generación/optimización de imágenes de marketing y assets visuales.
- `ad-creative`: útil para banners/flyers y piezas de campaña cuando se creen anuncios.

### Backend, base de datos y medición

- `supabase-postgres-best-practices`: aunque usamos Neon/Postgres, sirve para diseño y optimización PostgreSQL.
- `analytics`: eventos, funnels, conversiones, paneles y medición real.
- `revops`: ingresos, pipeline, usuarios, planes, pagos y operaciones comerciales.

### SaaS, monetización y retención

- `pricing`: planes, empaquetado, precios y estrategia de monetización.
- `paywalls`: pantallas de upgrade, límites por plan y conversión dentro de la app.
- `signup`: flujo de registro, activación y reducción de fricción.
- `onboarding`: experiencia inicial de clientes que compran la plataforma.
- `churn-prevention`: retención, renovaciones, vencimientos y recuperación de usuarios.
- `offers`: oferta comercial, valor percibido, garantías y presentación de planes.

### Marketing central

- `product-marketing`: posicionamiento, ICP y contexto comercial base.
- `marketing-plan`: plan integral de crecimiento.
- `copywriting`: textos persuasivos para landing, emails, CTAs y ventas.
- `copy-editing`: pulido de textos existentes.
- `content-strategy`: estrategia de contenido y temas.
- `customer-research`: investigación de usuarios y voz del cliente.
- `seo-audit`: SEO técnico y on-page.
- `ai-seo`: visibilidad en buscadores con IA.
- `schema`: datos estructurados para Google.
- `launch`: lanzamiento beta, versión 1.0 y futuras versiones.
- `emails`: automatizaciones y secuencias por correo.
- `sms`: sirve como guía conceptual para mensajes transaccionales tipo WhatsApp.
- `social`: publicaciones y contenido social.
- `prospecting`: búsqueda de clientes potenciales.
- `sales-enablement`: materiales de venta, objeciones, demo y propuestas.
- `free-tools`: calculadoras o herramientas gratis para captar leads.
- `lead-magnets`: recursos descargables para captar leads.
- `popups`: capturas, banners y modales de conversión.
- `ab-testing`: experimentos de landing, CTA y pricing.
- `marketing-loops`: rutinas recurrentes de revisión y crecimiento.
- `find-skills`: búsqueda e instalación futura de nuevas skills.

## Skills retiradas de la carpeta local activa

Estas no son malas; simplemente no son necesarias para el enfoque actual de Island Play:

- `aso`: optimización de App Store/Google Play; no estamos creando app móvil todavía.
- `co-marketing`: campañas con socios; no es prioridad beta.
- `community-marketing`: comunidad/Discord/Slack; no es prioridad actual.
- `competitor-profiling`: perfiles profundos de competidores; se puede reinstalar si hacemos investigación formal.
- `competitors`: páginas “vs/alternativas”; no necesitamos páginas competitivas ahora.
- `directory-submissions`: directorios/backlinks; útil más adelante, no durante producto beta.
- `marketing-council`: consejo simulado de marketing; redundante con skills ejecutables.
- `marketing-ideas`: ideas generales; queda cubierto por `marketing-plan`, `product-marketing` y `content-strategy`.
- `marketing-psychology`: útil pero redundante con `cro`, `copywriting`, `offers` y `pricing`.
- `programmatic-seo`: SEO masivo por plantillas; prematuro.
- `public-relations`: prensa/medios; no es canal inmediato.
- `referrals`: programa de referidos; futuro, no beta.
- `video`: producción de video; no es necesaria para desarrollo inmediato.

## Nota

Las skills retiradas fueron movidas desde `.agents/skills` hacia `.agents/skills_disabled/2026-07-23-prune/`. Así dejan de estar activas como skills locales, pero siguen disponibles como respaldo si en el futuro las necesitamos.
