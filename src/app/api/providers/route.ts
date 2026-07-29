import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { providerSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const providers = await prisma.provider.findMany({
    where: { deletedAt: null },
    include: {
      offers: {
        where: { deletedAt: null, active: true },
        include: { product: { select: { id: true, name: true, color: true, imageUrl: true } } },
        orderBy: { product: { name: "asc" } }
      }
    },
    orderBy: { name: "asc" }
  });

  return jsonOk({ providers });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const data = providerSchema.parse(await readJson(request));
    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        contact: data.contact,
        supportPhone: data.supportPhone,
        paymentPhone: data.paymentPhone,
        notes: data.notes,
        offers: {
          create: uniqueOffers(data.offers).map((offer) => ({
            productId: offer.productId,
            costCents: offer.costCents
          }))
        }
      }
    });
    return jsonOk({ provider });
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
    const data = providerSchema.parse(body);
    const provider = await prisma.$transaction(async (tx) => {
      await tx.providerOffer.deleteMany({ where: { providerId: body.id } });
      return tx.provider.update({
        where: { id: body.id },
        data: {
          name: data.name,
          contact: data.contact,
          supportPhone: data.supportPhone,
          paymentPhone: data.paymentPhone,
          notes: data.notes,
          offers: {
            create: uniqueOffers(data.offers).map((offer) => ({
              productId: offer.productId,
              costCents: offer.costCents
            }))
          }
        }
      });
    });
    return jsonOk({ provider });
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
    const now = new Date();
    const provider = await prisma.$transaction(async (tx) => {
      await tx.providerOffer.updateMany({ where: { providerId: id }, data: { active: false, deletedAt: now } });
      return tx.provider.update({
        where: { id },
        data: { deletedAt: now }
      });
    });
    return jsonOk({ provider });
  } catch (error) {
    return jsonError(error);
  }
}

function uniqueOffers(offers: Array<{ productId: string; costCents: number }>) {
  return Array.from(
    offers
      .filter((offer) => offer.productId)
      .reduce((map, offer) => map.set(offer.productId, offer), new Map<string, { productId: string; costCents: number }>())
      .values()
  );
}
