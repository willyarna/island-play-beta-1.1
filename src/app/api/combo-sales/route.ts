import { ProfileStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import {
  deliveryClientSelect,
  operationalAccountSelect,
  toComboSaleDeliveryDto
} from "@/lib/server/accounts/operational-account-dto";
import {
  normalizeProfilePin,
  prepareProfilePinDualWrite,
  protectCreatedAccountCredentials
} from "@/lib/server/credentials/credential-dual-write";
import { comboSaleProfileSelect } from "@/lib/server/sales/sale-profile-selects";
import { comboSaleSchema } from "@/lib/validation";

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
    const input = comboSaleSchema.parse(await readJson(request));
    const result = await prisma.$transaction(async (tx) => {
      const combo = await tx.combo.findFirst({
        where: { id: input.comboId, active: true, deletedAt: null },
        include: { items: { include: { product: { select: { id: true, name: true } } } } }
      });

      if (!combo) throw new Error("COMBO_NOT_FOUND");
      const comboProductById = new Map(combo.items.map((item) => [item.productId, item.product]));

      const comboProductIds = new Set(combo.items.map((item) => item.productId));
      const repeatedProfiles = new Set<string>();
      for (const item of input.items) {
        if (!comboProductIds.has(item.productId)) throw new Error("COMBO_PRODUCT_MISMATCH");
        if (item.mode === "EXISTING") {
          if (!item.accountId || !item.profileId) throw new Error("PROFILE_NOT_FOUND");
          if (repeatedProfiles.has(item.profileId)) throw new Error("PROFILE_REPEATED");
          repeatedProfiles.add(item.profileId);
        }
        if (item.mode === "CREATE" && (!item.email?.trim() || !item.password?.trim())) throw new Error("ACCOUNT_DATA_REQUIRED");
      }

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

      const existingItems = input.items.filter((item) => item.mode === "EXISTING");
      const profiles = await tx.profile.findMany({
        where: { id: { in: existingItems.map((item) => item.profileId).filter(Boolean) as string[] }, deletedAt: null },
        select: comboSaleProfileSelect
      });

      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

      for (const item of existingItems) {
        const profile = profileById.get(item.profileId || "");
        if (!profile || profile.account.deletedAt) throw new Error("PROFILE_NOT_FOUND");
        if (profile.accountId !== item.accountId) throw new Error("PROFILE_ACCOUNT_MISMATCH");
        if (profile.account.productId !== item.productId) throw new Error("PROFILE_PRODUCT_MISMATCH");
        if (profile.clientId && profile.clientId !== client.id) throw new Error("PROFILE_BUSY");
      }

      const existingPinWrites = await Promise.all(
        existingItems.map((item) => prepareProfilePinDualWrite({
          profileId: item.profileId || "",
          pin: item.pin
        }))
      );

      const existingDeliveries = await Promise.all(
        existingItems.map(async (item, index) => {
          const updated = await tx.profile.update({
            where: { id: item.profileId || "" },
            data: {
              clientId: client.id,
              name: item.profileName,
              ...existingPinWrites[index],
              dueDate: atDate(item.dueDate),
              soldCents: item.soldCents,
              status: ProfileStatus.OCCUPIED
            },
            select: { id: true }
          });
          return { accountId: item.accountId || "", profileId: updated.id };
        })
      );

      const createdDeliveries: Array<{ accountId: string; profileId: string | null }> = [];
      for (const item of input.items.filter((row) => row.mode === "CREATE")) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null, active: true },
          select: { maxProfiles: true, name: true }
        });
        if (!product) throw new Error("PRODUCT_NOT_FOUND");
        const provider = item.providerId
          ? await tx.provider.findFirst({ where: { id: item.providerId, deletedAt: null }, select: { name: true } })
          : null;
        const accountPassword = item.password?.trim() || "";

        const createdAccount = await tx.account.create({
          data: {
            productId: item.productId,
            providerId: item.providerId || null,
            email: item.email?.trim() || "",
            password: accountPassword,
            notes: `Creada desde venta combo ${combo.name}`,
            billingDate: atDate(item.dueDate),
            purchaseCents: item.purchaseCents,
            hidden: false,
            profiles: {
              create: Array.from({ length: product.maxProfiles }, (_, index) => ({
                name: index === 0 ? item.profileName : `Perfil ${index + 1}`,
                pin: index === 0 ? normalizeProfilePin(item.pin) : `${1000 + index + 1}`,
                clientId: index === 0 ? client.id : null,
                dueDate: atDate(item.dueDate),
                soldCents: index === 0 ? item.soldCents : 0,
                status: index === 0 ? ProfileStatus.OCCUPIED : ProfileStatus.FREE
              }))
            }
          },
          select: {
            id: true,
            email: true,
            profiles: { select: { id: true, pin: true }, orderBy: { name: "asc" } }
          }
        });
        await protectCreatedAccountCredentials({
          transaction: tx,
          accountId: createdAccount.id,
          password: accountPassword,
          profiles: createdAccount.profiles
        });
        createdDeliveries.push({ accountId: createdAccount.id, profileId: createdAccount.profiles[0]?.id || null });

        if (item.purchaseCents > 0) {
          await tx.movement.create({
            data: {
              type: "EXPENSE",
              concept: `Compra combo · Combo: ${combo.name} · Servicio: ${product.name} · Proveedor: ${provider?.name || "Sin proveedor"} · Cuenta: ${createdAccount.email} · Cliente: ${client.name}`,
              amountCents: item.purchaseCents,
              date: new Date()
            }
          });
        }
      }

      await tx.client.update({
        where: { id: client.id },
        data: { status: "ACTIVE" }
      });

      const incomeCents = input.totalSaleCents || input.items.reduce((sum, item) => sum + item.soldCents, 0);
      const movement = await tx.movement.create({
        data: {
          type: "INCOME",
          concept: `Venta combo · Combo: ${combo.name} · Cliente: ${client.name} · Servicios: ${input.items.map((item) => comboProductById.get(item.productId)?.name || "Servicio").join(" + ")} · Costo real: ${Math.round(input.items.reduce((sum, item) => sum + item.purchaseCents, 0) / 100).toLocaleString("es-CO")}`,
          amountCents: incomeCents,
          date: new Date()
        }
      });

      return { clientId: client.id, movement, deliveries: [...existingDeliveries, ...createdDeliveries] };
    });

    const accountIds = Array.from(new Set(result.deliveries.map((delivery) => delivery.accountId).filter(Boolean)));
    const [client, accounts] = await Promise.all([
      prisma.client.findFirst({
        where: { id: result.clientId, deletedAt: null },
        select: deliveryClientSelect
      }),
      prisma.account.findMany({
        where: { id: { in: accountIds }, deletedAt: null },
        select: operationalAccountSelect
      })
    ]);
    const accountById = new Map(accounts.map((account) => [account.id, account]));
    const deliveryEntries = result.deliveries.flatMap((delivery) => {
      const account = accountById.get(delivery.accountId);
      return account ? [{ account, profileId: delivery.profileId }] : [];
    });

    return jsonOk({
      ...result,
      delivery: client
        ? toComboSaleDeliveryDto({ client, entries: deliveryEntries })
        : { client: null, entries: [] }
    });
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        COMBO_NOT_FOUND: "El combo seleccionado ya no existe o está inactivo.",
        COMBO_PRODUCT_MISMATCH: "Uno de los servicios seleccionados no pertenece al combo.",
        PROFILE_REPEATED: "No puedes usar el mismo perfil dos veces en una venta combo.",
        ACCOUNT_DATA_REQUIRED: "Para crear una cuenta desde la venta debes escribir usuario/correo y contraseña.",
        CLIENT_NOT_FOUND: "El cliente seleccionado no existe.",
        PRODUCT_NOT_FOUND: "Uno de los servicios del combo ya no existe o está inactivo.",
        PROFILE_NOT_FOUND: "Uno de los perfiles seleccionados no existe o la cuenta fue eliminada.",
        PROFILE_ACCOUNT_MISMATCH: "Uno de los perfiles no pertenece a la cuenta seleccionada.",
        PROFILE_PRODUCT_MISMATCH: "Una cuenta seleccionada no corresponde al servicio del combo.",
        PROFILE_BUSY: "Uno de los perfiles ya tiene un cliente asignado. Selecciona un perfil libre."
      };
      if (messages[error.message]) return conflict(messages[error.message]);
    }
    return jsonError(error);
  }
}
