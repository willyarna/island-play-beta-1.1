import { ProfileStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import {
  operationalAccountSelect,
  toOperationalAccountDto
} from "@/lib/server/accounts/operational-account-dto";
import { accountSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const q = searchParams.get("q")?.trim();
  const showHidden = searchParams.get("hidden") === "true";

  const accounts = await prisma.account.findMany({
    where: {
      deletedAt: null,
      hidden: showHidden ? undefined : false,
      productId: productId && productId !== "all" ? productId : undefined,
      email: q ? { contains: q, mode: "insensitive" } : undefined
    },
    select: operationalAccountSelect,
    orderBy: { email: "asc" }
  });

  return jsonOk({ accounts: accounts.map(toOperationalAccountDto) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const input = accountSchema.parse(await readJson(request));

    const account = await prisma.$transaction(async (tx) => {
      const clientIds = input.profiles.map((profile) => profile.clientId).filter(Boolean) as string[];
      const created = await tx.account.create({
        data: {
          productId: input.productId,
          providerId: input.providerId || null,
          email: input.email,
          password: input.password,
          notes: input.notes,
          billingDate: new Date(`${input.billingDate}T00:00:00`),
          purchaseCents: input.purchaseCents,
          hidden: input.hidden,
          profiles: {
            create: input.profiles.map((profile) => ({
              name: profile.name,
              pin: profile.pin,
              clientId: profile.clientId || null,
              dueDate: new Date(`${profile.dueDate}T00:00:00`),
              soldCents: profile.soldCents,
              status: profile.clientId ? ProfileStatus.OCCUPIED : ProfileStatus.FREE
            }))
          }
        },
        select: operationalAccountSelect
      });

      if (input.purchaseCents > 0) {
        await tx.movement.create({
          data: {
            type: "EXPENSE",
            concept: `Compra cuenta ${created.email}`,
            amountCents: input.purchaseCents,
            date: new Date()
          }
        });
      }

      if (clientIds.length) {
        await tx.client.updateMany({
          where: { id: { in: clientIds } },
          data: { status: "ACTIVE" }
        });
      }

      return created;
    });

    return jsonOk({ account: toOperationalAccountDto(account) });
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
    const input = accountSchema.parse(body);

    const account = await prisma.$transaction(async (tx) => {
      const previousProfiles = await tx.profile.findMany({
        where: { accountId: body.id, deletedAt: null },
        select: { soldCents: true, clientId: true }
      });
      const previousSoldCents = previousProfiles.reduce((sum, profile) => sum + profile.soldCents, 0);
      const nextSoldCents = input.profiles.reduce((sum, profile) => sum + profile.soldCents, 0);
      const clientIds = input.profiles.map((profile) => profile.clientId).filter(Boolean) as string[];
      const affectedClientIds = Array.from(new Set([
        ...previousProfiles.map((profile) => profile.clientId).filter(Boolean),
        ...clientIds
      ])) as string[];

      await tx.profile.deleteMany({ where: { accountId: body.id } });

      const updated = await tx.account.update({
        where: { id: body.id },
        data: {
          productId: input.productId,
          providerId: input.providerId || null,
          email: input.email,
          password: input.password,
          notes: input.notes,
          billingDate: new Date(`${input.billingDate}T00:00:00`),
          purchaseCents: input.purchaseCents,
          hidden: input.hidden,
          profiles: {
            create: input.profiles.map((profile) => ({
              name: profile.name,
              pin: profile.pin,
              clientId: profile.clientId || null,
              dueDate: new Date(`${profile.dueDate}T00:00:00`),
              soldCents: profile.soldCents,
              status: profile.clientId ? ProfileStatus.OCCUPIED : ProfileStatus.FREE
            }))
          }
        },
        select: operationalAccountSelect
      });

      for (const clientId of affectedClientIds) {
        const activeProfiles = await tx.profile.count({
          where: { clientId, deletedAt: null, account: { deletedAt: null } }
        });
        await tx.client.update({
          where: { id: clientId },
          data: { status: activeProfiles > 0 ? "ACTIVE" : "INACTIVE" }
        });
      }

      if (nextSoldCents > previousSoldCents) {
        await tx.movement.create({
          data: {
            type: "INCOME",
            concept: `Venta perfil ${updated.email}`,
            amountCents: nextSoldCents - previousSoldCents,
            date: new Date()
          }
        });
      }

      return updated;
    });

    return jsonOk({ account: toOperationalAccountDto(account) });
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
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const occupied = await tx.account.findMany({
        where: {
          id: { in: targetIds },
          deletedAt: null,
          profiles: { some: { deletedAt: null, clientId: { not: null } } }
        },
        select: { email: true }
      });
      if (occupied.length) {
        throw new Error(`No se puede eliminar esa cuenta ya que tiene un cliente o varios clientes asignados. Primero debe eliminar los clientes para poderla eliminar del sistema: ${occupied.map((account) => account.email).join(", ")}`);
      }

      await tx.profile.updateMany({ where: { accountId: { in: targetIds } }, data: { deletedAt: now } });
      await tx.account.updateMany({ where: { id: { in: targetIds } }, data: { deletedAt: now, hidden: true } });
    });
    return jsonOk({ ok: true, deleted: targetIds.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No se puede eliminar")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return jsonError(error);
  }
}
