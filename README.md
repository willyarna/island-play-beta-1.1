# Larsa Play Beta 1.0

Plataforma full-stack para gestionar cuentas de streaming, clientes, proveedores,
servicios, perfiles, vencimientos, movimientos, reportes y preparacion para
automatizaciones de WhatsApp/n8n.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Sesiones con cookie httpOnly
- Validacion runtime con Zod

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno:

```bash
cp .env.example .env
```

3. Configurar `DATABASE_URL` con tu base PostgreSQL.

4. Ejecutar migraciones:

```bash
npm run prisma:migrate
```

5. Crear datos demo:

```bash
npm run db:seed
```

6. Iniciar desarrollo:

```bash
npm run dev
```

## Deploy beta

Para hosting tipo Vercel:

- Build command: `npm run build`
- Install command: `npm install`
- Output: Next.js automatico

Variables requeridas:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/larsa_play?schema=public"
SESSION_COOKIE_NAME="larsa_session"
SESSION_COOKIE_SECURE="true"
```

Aplicar migraciones en la base remota:

```bash
npm run prisma:deploy
```

## Acceso demo local

- Correo: `admin@larsaplay.local`
- Contrasena: `admin123`

## Version

`v1.0.0-beta`

## Documentacion clave

- `PROJECT_MEMORY.md`: memoria viva, estado y roadmap del proyecto.
- `docs/HANDOFF-SUMMARY.md`: resumen para traspasar el proyecto a otra cuenta o desarrollador.
- `ARCHITECTURE.md`: arquitectura actual.
- `docs/decisions/`: decisiones arquitectonicas.
