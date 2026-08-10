import { ProfileStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import {
  deliveryClientSelect,
  operationalAccountSelect,
  toIndividualSaleDeliveryDto
} from "@/lib/server/accounts/operational-account-dto";
import { individualSaleProfileSelect } from "@/lib/server/sales/sale-profile-selects";
import { individualSaleSchema } from "@/lib/validation";

function atDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const input = individualSaleSchema.parse(await readJson(request));

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: input.productId, deletedAt: null, active: true },
        select: { id: true, name: true, maxProfiles: true }
      });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      const provider = input.providerId
        ? await tx.provider.findFirst({ where: { id: input.providerId, deletedAt: null }, select: { id: true, name: true } })
        : null;

      const client = input.clientId
        ? await tx.client.findFirst({ where: { id: input.clientId, deletedAt: null } })
        : await tx.client.create({
            data: {
              name: input.client?.name || "",
              phone: input.client?.phone || null,
              email: input.client?.email || null,
              notes: input.client?.notes || input.notes || null,
              status: "ACTIVE"
            }
          });

      if (!client) throw new Error("CLIENT_NOT_FOUND");

      if (input.mode === "EXISTING") {
        if (!input.accountId || !input.profileId) throw new Error("PROFILE_NOT_FOUND");

        const profile = await tx.profile.findFirst({
          where: { id: input.profileId, deletedAt: null },
          select: individualSaleProfileSelect
        });

        if (!profile || profile.account.deletedAt) throw new Error("PROFILE_NOT_FOUND");
        if (profile.accountId !== input.accountId) throw new Error("PROFILE_ACCOUNT_MISMATCH");
        if (profile.account.productId !== product.id) throw new Error("PROFILE_PRODUCT_MISMATCH");
        if (profile.clientId && profile.clientId !== client.id) throw new Error("PROFILE_BUSY");

        const previousSoldCents = profile.soldCents;
        const updatedProfile = await tx.profile.update({
          where: { id: profile.id },
          data: {
            clientId: client.id,
            name: input.profileName,
            pin: input.pin || null,
            dueDate: atDate(input.dueDate),
            soldCents: input.soldCents,
            status: ProfileStatus.OCCUPIED
          },
          select: { id: true }
        });

        await tx.client.update({
          where: { id: client.id },
          data: { status: "ACTIVE" }
        });

        if (input.soldCents > previousSoldCents) {
          await tx.movement.create({
            data: {
              type: "INCOME",
              concept: `Venta individual · Servicio: ${product.name} · Cliente: ${client.name} · Perfil: ${input.profileName} · Cuenta: ${profile.account.email}`,
              amountCents: input.soldCents - previousSoldCents,
              date: new Date()
            }
          });
        }

        return { clientId: client.id, accountId: profile.accountId, profileId: updatedProfile.id };
      }

      if (!input.email?.trim() || !input.password?.trim()) throw new Error("ACCOUNT_DATA_REQUIRED");

      const createdAccount = await tx.account.create({
        data: {
          productId: product.id,
          providerId: input.providerId || null,
          email: input.email.trim(),
          password: input.password.trim(),
          notes: input.notes || "Creada desde venta individual",
          billingDate: atDate(input.dueDate),
          purchaseCents: input.purchaseCents,
          hidden: false,
          profiles: {
            create: Array.from({ length: product.maxProfiles }, (_, index) => ({
              name: index === 0 ? input.profileName : `Perfil ${index + 1}`,
              pin: index === 0 ? input.pin || null : `${1000 + index + 1}`,
              clientId: index === 0 ? client.id : null,
              dueDate: atDate(input.dueDate),
              soldCents: index === 0 ? input.soldCents : 0,
              status: index === 0 ? ProfileStatus.OCCUPIED : ProfileStatus.FREE
            }))
          }
        },
        select: {
          id: true,
          email: true,
          profiles: { select: { id: true }, orderBy: { name: "asc" } }
        }
      });

      if (input.purchaseCents > 0) {
        await tx.movement.create({
          data: {
            type: "EXPENSE",
            concept: `Compra cuenta · Servicio: ${product.name} · Proveedor: ${provider?.name || "Sin proveedor"} · Cuenta: ${createdAccount.email} · Venta individual para: ${client.name}`,
            amountCents: input.purchaseCents,
            date: new Date()
          }
        });
      }

      if (input.soldCents > 0) {
        await tx.movement.create({
          data: {
            type: "INCOME",
            concept: `Venta individual · Servicio: ${product.name} · Cliente: ${client.name} · Perfil: ${input.profileName} · Cuenta: ${createdAccount.email} · Proveedor: ${provider?.name || "Sin proveedor"} · Costo: ${Math.round(input.purchaseCents / 100).toLocaleString("es-CO")}`,
            amountCents: input.soldCents,
            date: new Date()
          }
        });
      }

      await tx.client.update({
        where: { id: client.id },
        data: { status: "ACTIVE" }
      });

      return { clientId: client.id, accountId: createdAccount.id, profileId: createdAccount.profiles[0]?.id || null };
    });

    const account = await prisma.account.findFirst({
      where: { id: result.accountId, deletedAt: null },
      select: operationalAccountSelect
    });
    const client = await prisma.client.findFirst({
      where: { id: result.clientId, deletedAt: null },
      select: deliveryClientSelect
    });

    return jsonOk({
      ...result,
      delivery: account && client
        ? toIndividualSaleDeliveryDto({ client, profileId: result.profileId, account })
        : null
    });
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        PRODUCT_NOT_FOUND: "El servicio seleccionado ya no existe o está inactivo.",
        CLIENT_NOT_FOUND: "El cliente seleccionado no existe.",
        PROFILE_NOT_FOUND: "El perfil seleccionado no existe o la cuenta fue eliminada.",
        PROFILE_ACCOUNT_MISMATCH: "El perfil no pertenece a la cuenta seleccionada.",
        PROFILE_PRODUCT_MISMATCH: "La cuenta seleccionada no corresponde al servicio vendido.",
        PROFILE_BUSY: "Ese perfil ya tiene un cliente asignado. Selecciona un perfil libre.",
        ACCOUNT_DATA_REQUIRED: "Para crear una cuenta desde la venta debes escribir usuario/correo y contraseña."
      };
      if (messages[error.message]) return conflict(messages[error.message]);
    }

    return jsonError(error);
  }
}
