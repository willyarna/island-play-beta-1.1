import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

export async function POST() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const [setting, account] = await Promise.all([
    prisma.setting.findUnique({ where: { id: "default" } }),
    prisma.account.findFirst({
      include: {
        product: true,
        profiles: { include: { client: true }, orderBy: { createdAt: "asc" } }
      }
    })
  ]);

  if (!setting || !account) {
    return NextResponse.json({ error: "Faltan datos para previsualizar" }, { status: 400 });
  }

  const profile = account.profiles.find((item) => item.clientId) || account.profiles[0];
  const message = setting.template
    .replaceAll("{{cliente}}", profile.client?.name || "Cliente")
    .replaceAll("{{servicio}}", account.product.name)
    .replaceAll("{{vence}}", profile.dueDate.toISOString().slice(0, 10))
    .replaceAll("{{correo}}", account.email)
    .replaceAll("{{password}}", account.password)
    .replaceAll("{{perfil}}", profile.name)
    .replaceAll("{{pin}}", profile.pin || "");

  return NextResponse.json({ message });
}
