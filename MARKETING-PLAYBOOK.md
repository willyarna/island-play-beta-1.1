# MARKETING PLAYBOOK — Larsa Play

Este playbook convierte Larsa Play en un proyecto listo para captar usuarios, medir resultados y mejorar conversiones con un flujo repetible.

## Skill/kit principal elegido

Elegí `coreyhaines31/marketingskills` como kit principal de marketing.

Motivo: es una colección enfocada justo en lo que necesita Larsa Play: CRO, SEO, copywriting, analytics, contenido, emails, growth, pricing, referrals y lanzamiento. Además tiene instalación documentada para agentes compatibles con Codex:

```bash
npx skills add coreyhaines31/marketingskills
```

Estado local: instalado en el proyecto con 47 skills dentro de:

```txt
.agents/skills/
```

Skills clave para este proyecto:

- `product-marketing`: posicionamiento, audiencia, mensajes base.
- `site-architecture`: estructura de landing, navegación e interlinking.
- `seo-audit`, `ai-seo`, `schema`, `programmatic-seo`: SEO técnico y contenido escalable.
- `copywriting`, `copy-editing`, `content-strategy`: páginas, blog, emails y redes.
- `cro`, `ab-testing`, `signup`, `onboarding`, `popups`, `lead-magnets`: conversión y activación.
- `analytics`: eventos, funnels, KPIs y medición.
- `ads`, `ad-creative`, `social`, `video`, `emails`, `cold-email`: adquisición.
- `pricing`, `offers`, `paywalls`, `referrals`: monetización y expansión.
- `marketing-plan`, `launch`, `marketing-loops`: planificación y mejora continua.

## Comparación con otras opciones

| Opción | Mejor uso | Límite para Larsa Play |
| --- | --- | --- |
| `marketingskills` | Marketing operativo completo: SEO, CRO, analytics, contenido, campañas y growth | Requiere que definamos contexto de producto y métricas reales |
| CodexKit / skills de GTM | Briefs, posicionamiento, inteligencia competitiva y planeación ejecutiva | Menos centrado en ejecución diaria de SEO/CRO/analytics |
| Blogs y videos de marketing con Codex | Inspiración de workflow y estructura de equipo | No son un kit instalable por sí mismos |

Decisión: usar `marketingskills` como sistema principal y complementar con CodexKit solo para estrategia puntual, por ejemplo `codexkit-go-to-market-planner` o `codexkit-campaign-brief-writer` si más adelante quieres campañas grandes.

## Flujo recomendado para Larsa Play

### 1. Investigación de audiencia y palabras clave

Objetivo: saber qué busca la gente que puede comprar la plataforma.

Segmentos iniciales:

- revendedores de cuentas streaming;
- administradores de combos de plataformas;
- negocios que manejan clientes por WhatsApp;
- proveedores o distribuidores de servicios digitales;
- usuarios que necesitan controlar vencimientos, ganancias e inversión.

Keywords iniciales para validar:

- gestión de cuentas streaming;
- panel para revendedores streaming;
- software para vender cuentas Netflix;
- sistema para administrar clientes streaming;
- CRM para servicios streaming;
- control de vencimientos por WhatsApp;
- plataforma para cuentas compartidas;
- gestión de proveedores streaming.

Skills a usar:

- `customer-research`
- `seo-audit`
- `ai-seo`
- `programmatic-seo`
- `competitors`
- `competitor-profiling`

### 2. Landing e index profesional

Objetivo: que la primera pantalla comunique valor y capture leads.

Estructura recomendada:

1. Hero con promesa clara:
   - “Administra cuentas, clientes, proveedores, vencimientos y ganancias desde un solo panel.”
2. CTA principal:
   - “Solicitar demo”
   - “Probar beta”
   - “Hablar por WhatsApp”
3. Vista previa del dashboard.
4. Beneficios:
   - control de perfiles;
   - vencimientos automatizados;
   - proveedores y costos;
   - balance de inversión y ganancia;
   - exportación/importación Excel;
   - futura integración con n8n/WhatsApp.
5. Prueba social o demo:
   - capturas, video corto, casos de uso.
6. Planes o formulario de espera.

Skills a usar:

- `ui-design`
- `ui-ux-pro-max`
- `copywriting`
- `cro`
- `signup`
- `lead-magnets`

### 3. CTAs y funnels

Funnels iniciales:

```txt
Visitante -> Ver demo -> Formulario/WhatsApp -> Beta -> Activación -> Pago -> Renovación
```

CTAs recomendados:

- “Ver demo de Larsa Play”
- “Quiero probar la beta”
- “Organizar mis cuentas streaming”
- “Calcular mis ganancias”
- “Conectar con WhatsApp”

Eventos que deben medirse:

| Evento | Cuándo se dispara |
| --- | --- |
| `landing_view` | Al cargar la landing |
| `cta_demo_click` | Clic en demo |
| `whatsapp_click` | Clic en contacto WhatsApp |
| `lead_form_submit` | Envío de formulario |
| `login_submit` | Intento de inicio de sesión |
| `trial_started` | Usuario habilitado en beta |
| `subscription_enabled` | Admin habilita tiempo comprado |
| `provider_created` | Se crea proveedor |
| `service_created` | Se crea servicio |
| `account_created` | Se crea cuenta |
| `profile_assigned` | Se asigna cliente a perfil |
| `xlsx_export` | Exportación de datos |
| `xlsx_import` | Importación de datos |

Skills a usar:

- `analytics`
- `cro`
- `ab-testing`
- `onboarding`
- `churn-prevention`

### 4. Banners, flyers e imágenes de campaña

Assets prioritarios:

- banner principal de landing;
- flyer cuadrado para WhatsApp/Instagram;
- banner horizontal para Facebook;
- miniaturas para tutoriales;
- imágenes de campaña “antes/después”;
- screenshots limpios de la plataforma.

Flujo:

1. Definir campaña con `marketing-plan` o `campaign brief`.
2. Crear copies con `copywriting`.
3. Crear prompts visuales con `ad-creative` + `image2_UI_skill`.
4. Guardar assets en:

```txt
public/assets/banners/
public/assets/flyers/
public/assets/generated/
```

5. Integrarlos en componentes Next.js usando `next/image`.

### 5. Contenido para blog/email/social

Pilares de contenido:

- organización y rentabilidad;
- automatización WhatsApp/n8n;
- control de proveedores;
- vencimientos y renovaciones;
- Excel/importación/exportación;
- gestión de clientes;
- seguridad y buenas prácticas operativas.

Ideas iniciales:

- “Cómo controlar vencimientos de cuentas streaming sin perder clientes”
- “Cómo calcular ganancia real al vender combos de streaming”
- “Por qué necesitas separar proveedor, costo y precio de venta”
- “Automatizaciones WhatsApp para renovar servicios digitales”
- “Plantilla Excel vs plataforma: cuándo migrar a Larsa Play”

Skills a usar:

- `content-strategy`
- `copywriting`
- `copy-editing`
- `emails`
- `social`
- `video`

### 6. Medición y dashboard

Métricas de adquisición:

- visitas;
- CTR de CTA;
- leads;
- tasa visitante -> lead;
- tasa lead -> beta;
- costo por lead si hay pauta.

Métricas de activación:

- usuarios que crean su primer servicio;
- usuarios que crean proveedor;
- usuarios que crean cuenta;
- usuarios que asignan cliente;
- tiempo hasta primera cuenta creada.

Métricas de monetización:

- usuarios pagos;
- MRR;
- ingreso por plan;
- créditos comprados;
- renovaciones;
- churn.

Métricas internas de la plataforma:

- inversión por proveedor;
- venta total por servicio;
- ganancia por cuenta;
- ganancia diaria/mensual;
- cuentas vencidas;
- perfiles disponibles;
- perfiles por vencer.

### 7. Rutina semanal de crecimiento

Cada semana:

1. Revisar analytics y embudo.
2. Detectar una caída principal.
3. Proponer 3 hipótesis de mejora.
4. Ejecutar una mejora pequeña.
5. Medir 7 días.
6. Documentar resultado.

Ejemplo:

```txt
Problema: muchas visitas pero pocos formularios.
Hipótesis: el CTA principal no comunica beta ni valor.
Prueba: cambiar “Iniciar sesión” por “Solicitar demo de Larsa Play”.
Métrica: cta_demo_click / landing_view.
```

Skills a usar:

- `analytics`
- `cro`
- `ab-testing`
- `marketing-loops`

