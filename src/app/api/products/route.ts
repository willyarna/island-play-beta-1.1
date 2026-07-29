import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { productSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { provider: { select: { id: true, name: true } } },
    orderBy: { name: "asc" }
  });

  return jsonOk({ products });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const data = productSchema.parse(await readJson(request));
    const product = await prisma.product.create({ data });
    return jsonOk({ product });
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
    const data = productSchema.parse(body);
    const product = await prisma.product.update({
      where: { id: body.id },
      data
    });
    return jsonOk({ product });
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
    const product = await prisma.product.update({
      where: { id },
      data: { active: false, deletedAt: new Date() }
    });
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}
