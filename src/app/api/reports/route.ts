import { jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/security";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const [accounts, movements, clients] = await Promise.all([
    prisma.account.findMany({
      where: { deletedAt: null },
      include: {
        product: { select: { name: true } },
        provider: { select: { name: true } },
        profiles: { where: { deletedAt: null } }
      }
    }),
    prisma.movement.findMany({ orderBy: { date: "desc" }, take: 200 }),
    prisma.client.count({ where: { deletedAt: null, status: "ACTIVE" } })
  ]);

  const investedCents = accounts.reduce((sum, account) => sum + account.purchaseCents, 0);
  const soldCents = accounts.reduce((sum, account) => sum + account.profiles.reduce((inner, profile) => inner + profile.soldCents, 0), 0);

  return jsonOk({
    summary: {
      activeClients: clients,
      accounts: accounts.length,
      investedCents,
      soldCents,
      profitCents: soldCents - investedCents
    },
    accounts: accounts.map((account) => {
      const sold = account.profiles.reduce((sum, profile) => sum + profile.soldCents, 0);
      return {
        id: account.id,
        product: account.product.name,
        provider: account.provider?.name || null,
        purchaseCents: account.purchaseCents,
        soldCents: sold,
        profitCents: sold - account.purchaseCents
      };
    }),
    movements
  });
}
