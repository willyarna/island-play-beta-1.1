import { NextResponse } from "next/server";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { clientSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          profiles: { where: { deletedAt: null, account: { deletedAt: null } } }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return jsonOk({
    clients: clients.map(({ _count, ...client }) => ({
      ...client,
      status: _count.profiles > 0 ? "ACTIVE" : "INACTIVE"
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const data = clientSchema.parse(await readJson(request));
    const client = await prisma.client.create({ data });
    return jsonOk({ client });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const body = (await readJson(request)) as { id?: string };
    if (!body.id) return jsonError(new Error("ID requerido"));
    const data = clientSchema.parse(body);
    const client = await prisma.client.update({
      where: { id: body.id },
      data
    });
    return jsonOk({ client });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const { id, ids } = (await readJson(request)) as { id?: string; ids?: string[] };
    const targetIds = Array.from(new Set([...(ids || []), ...(id ? [id] : [])])).filter(Boolean);
    if (!targetIds.length) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const client = await prisma.$transaction(async (tx) => {
      const activeClients = await tx.client.findMany({
        where: {
          id: { in: targetIds },
          deletedAt: null,
          profiles: { some: { deletedAt: null, account: { deletedAt: null } } }
        },
        select: { name: true }
      });
      if (activeClients.length) {
        throw new Error(`No se pueden eliminar clientes activos. Primero quite sus perfiles o cuentas asignadas: ${activeClients.map((client) => client.name).join(", ")}`);
      }

      await tx.client.updateMany({
        where: { id: { in: targetIds } },
        data: { status: "INACTIVE", deletedAt: new Date() }
      });
      return targetIds.length === 1 ? tx.client.findUnique({ where: { id: targetIds[0] } }) : null;
    });
    return jsonOk({ client, deleted: targetIds.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No se pueden eliminar clientes activos")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return jsonError(error);
  }
}
