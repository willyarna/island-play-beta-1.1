# ASSETS SETUP — Larsa Play

Este documento deja claro cómo vamos a manejar diseño premium, iconos, banners, flyers e imágenes dentro del proyecto sin romper la funcionalidad de Next.js/Tailwind.

## Skills instaladas o verificadas

| Skill | Estado | Ruta |
| --- | --- | --- |
| `ui-design` | Instalada desde `hursh-shah/codex-design-skill/tree/main/ui-design` | `/home/fardsan/.codex/skills/ui-design` |
| `ui-ux-pro-max` | Disponible y usada para generar tokens/base visual | `/home/fardsan/.agents/skills/ui-ux-pro-max` |
| `ui-from-image` | Instalada desde `Ixe1/ui-from-image` | `/home/fardsan/.codex/skills/ui-from-image` |
| `image2_UI_skill` | Instalada desde `zhu-guli326/image2_UI_skill` | `/home/fardsan/.codex/skills/image2_UI_skill` |

Si una skill recién instalada no aparece en una conversación nueva, reinicia Codex para que cargue el catálogo actualizado.

## Estructura de assets del proyecto

Los assets deben quedar versionados en el repo, no sueltos en Descargas:

```txt
public/assets/
  icons/        iconos propios, marcas autorizadas o SVG optimizados
  banners/      banners de landing, campañas y secciones hero
  flyers/       flyers promocionales para WhatsApp/redes
  generated/    imágenes generadas por IA o procesadas
  screenshots/  referencias visuales usadas para recrear UI
docs/design-system/
  larsa-play-tokens.json
```

En Next.js, todo archivo dentro de `public/` se consume con ruta absoluta web:

```tsx
import Image from "next/image";

<Image
  src="/assets/banners/larsa-hero.webp"
  alt="Panel profesional de Larsa Play"
  width={1400}
  height={900}
  priority
/>
```

Para SVG simples también se puede usar:

```tsx
<img src="/assets/icons/netflix.svg" alt="Netflix" width={32} height={32} />
```

## Qué se hace con código y qué se genera como imagen

| Elemento | Método recomendado | Razón |
| --- | --- | --- |
| Botones, formularios, tablas, modales, badges, inputs | Código React/Tailwind | Deben ser accesibles, responsive, editables y funcionales |
| Iconos de acciones: editar, borrar, WhatsApp, copiar, calendario | `lucide-react` | El proyecto ya usa Lucide; mantener una sola familia evita inconsistencia |
| Logos de servicios reales | Imagen/SVG oficial o subida por usuario | Deben respetar proporción y verse nítidos |
| Banners, fondos, flyers, thumbnails y piezas promocionales | `image2_UI_skill` / generación de imagen | Son visuales complejos y no interactivos |
| Texto legible de botones, precios, estados o formularios | Código, nunca imagen generada | Mejora accesibilidad, SEO, traducción y mantenimiento |

Regla práctica: si el usuario debe hacer clic, seleccionar, copiar, filtrar o leer datos dinámicos, eso va en código. Si es una pieza visual promocional o ambiental, puede ser imagen.

## Uso de `image2_UI_skill`

La skill `image2_UI_skill` se usa para generar o recrear assets visuales complejos desde descripciones, screenshots o referencias. Flujo recomendado:

1. Guardar screenshots de referencia en `public/assets/screenshots/` o `docs/design-references/`.
2. Crear un manifiesto corto con:
   - nombre del asset;
   - ubicación final;
   - tamaño;
   - descripción visual;
   - dónde se usará.
3. Generar el asset con la skill o con el generador de imágenes disponible.
4. Guardarlo en `public/assets/generated/`, `public/assets/banners/` o `public/assets/flyers/`.
5. Integrarlo en el componente con `next/image`.
6. Revisar contraste, recorte, peso del archivo y si contiene texto que debería ser código.

Plantilla de prompt:

```txt
Crear un banner premium para Larsa Play, plataforma SaaS de gestión de cuentas streaming.
Estilo: dark OLED, glassmorphism sutil, acentos cyan/magenta/verde, dashboard profesional.
Composición: panel administrativo abstracto, tarjetas de métricas, iconos de streaming genéricos, fondo tecnológico.
Evitar: texto legible, logos reales no autorizados, botones falsos, marcas de agua.
Salida: 16:9, WebP, optimizado para landing hero.
Guardar como: public/assets/banners/larsa-hero.webp
```

## Uso de `ui-from-image`

`ui-from-image` sirve para recrear UI de alta fidelidad desde capturas:

1. Guardar la captura fuente en `docs/design-references/netfly/` o `docs/design-references/larsa/`.
2. Definir qué se debe copiar como patrón y qué se debe mejorar.
3. Recrear estructura en React/Tailwind con componentes reales, no como una imagen plana.
4. Comparar visualmente con la captura y corregir espaciado, contraste, tablas, modales y estados.

Para Larsa Play, esta skill debe usarse sobre todo en:

- modales de cuenta, cliente, proveedor y servicio;
- tablas de cuentas/clientes/servicios/proveedores;
- estados visuales de vencimiento;
- páginas de perfil/configuración;
- landing o login cuando quieras alta fidelidad desde una referencia.

## Integración de `ui-ux-pro-max`

`ui-ux-pro-max` no se “pega” como un paquete de componentes; funciona como catálogo de decisiones. Ya generé una base en:

```txt
docs/design-system/larsa-play-tokens.json
```

Cómo traer esos recursos al código:

1. Mantener `docs/design-system/larsa-play-tokens.json` como fuente de verdad.
2. Mapear los colores a variables CSS en `src/app/globals.css`, por ejemplo `--color-surface`, `--color-accent`, `--color-danger`.
3. Usar esos tokens en clases Tailwind o estilos CSS existentes.
4. Evitar hexadecimales sueltos dentro de componentes; si un color se repite, convertirlo en token.
5. Mantener `lucide-react` como librería principal de iconos funcionales. Si algún día se migra a otra librería, migrar todo el sistema de iconos a la vez.

Base visual recomendada por la skill:

- dashboard SaaS oscuro, OLED;
- superficies elevadas con separación clara;
- acentos cyan/magenta/verde;
- estados de vencimiento con verde, amarillo, naranja y rojo;
- interacciones de 150–300 ms;
- objetivos táctiles mínimos de 44px;
- contraste mínimo WCAG AA.

## Librerías recomendadas

Ya existe `lucide-react` en el proyecto, así que la recomendación es:

- seguir usando `lucide-react` para navegación, acciones, formularios y estados;
- usar SVG/PNG/WebP en `public/assets/icons/` para logos de servicios;
- usar WebP/AVIF para banners y flyers;
- no instalar otra librería de iconos salvo que se decida una migración completa.

