import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { comboSchema } from "@/lib/validation";

const comboInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, color: true, imageUrl: true } }
    },
    orderBy: { product: { name: "asc" } }
  }
} as const;

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const combos = await prisma.combo.findMany({
    where: { deletedAt: null, active: true },
    include: comboInclude,
    orderBy: { name: "asc" }
  });

  return jsonOk({ combos });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const data = comboSchema.parse(await readJson(request));
    const combo = await prisma.combo.create({
      data: {
        name: data.name,
        saleCents: data.saleCents,
        costCents: data.costCents,
        notes: data.notes,
        items: { create: uniqueProductIds(data.productIds).map((productId) => ({ productId })) }
      },
      include: comboInclude
    });
    return jsonOk({ combo });
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
    const data = comboSchema.parse(body);
    const combo = await prisma.$transaction(async (tx) => {
      await tx.comboItem.deleteMany({ where: { comboId: body.id } });
      return tx.combo.update({
        where: { id: body.id },
        data: {
          name: data.name,
          saleCents: data.saleCents,
          costCents: data.costCents,
          notes: data.notes,
          items: { create: uniqueProductIds(data.productIds).map((productId) => ({ productId })) }
        },
        include: comboInclude
      });
    });
    return jsonOk({ combo });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const { id } = (await readJson(request)) as { id?: string };
    if (!id) return jsonError(new Error("ID requerido"));
    const combo = await prisma.combo.update({
      where: { id },
      data: { active: false, deletedAt: new Date() }
    });
    return jsonOk({ combo });
  } catch (error) {
    return jsonError(error);
  }
}

function uniqueProductIds(productIds: string[]) {
  return Array.from(new Set(productIds.filter(Boolean)));
}
