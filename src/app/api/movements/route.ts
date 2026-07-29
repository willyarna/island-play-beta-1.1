import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { movementSchema, movementUpdateSchema } from "@/lib/validation";

function atDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const movements = await prisma.movement.findMany({
    orderBy: { date: "desc" },
    take: 300
  });

  return jsonOk(movements);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const input = movementSchema.parse(await readJson(request));
    const movement = await prisma.movement.create({
      data: {
        type: input.type,
        concept: input.concept.trim(),
        amountCents: input.amountCents,
        date: atDate(input.date)
      }
    });

    return jsonOk(movement);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const input = movementUpdateSchema.parse(await readJson(request));
    const movement = await prisma.movement.update({
      where: { id: input.id },
      data: {
        type: input.type,
        concept: input.concept.trim(),
        amountCents: input.amountCents,
        date: atDate(input.date)
      }
    });

    return jsonOk(movement);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const { id } = (await readJson(request)) as { id?: string };
    if (!id) return new Response(JSON.stringify({ error: "ID requerido" }), { status: 400 });

    await prisma.movement.delete({ where: { id } });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
