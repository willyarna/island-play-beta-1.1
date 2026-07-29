import { jsonError, jsonOk, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";
import { settingsSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const settings = await prisma.setting.findUnique({ where: { id: "default" } });
  return jsonOk({ settings });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const input = settingsSchema.parse(await readJson(request));
    const settings = await prisma.setting.upsert({
      where: { id: "default" },
      update: {
        ...input,
        accessUntil: input.accessUntil ? new Date(`${input.accessUntil}T00:00:00`) : null
      },
      create: {
        id: "default",
        ...input,
        accessUntil: input.accessUntil ? new Date(`${input.accessUntil}T00:00:00`) : null
      }
    });
    return jsonOk({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
