import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/LoginForm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginForm />;
  }

  const [products, providers, clients, accounts, combos, report] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      include: { provider: { select: { id: true, name: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.provider.findMany({
      where: { deletedAt: null },
      include: {
        offers: {
          where: { deletedAt: null, active: true },
          include: { product: { select: { id: true, name: true, color: true, imageUrl: true } } },
          orderBy: { product: { name: "asc" } }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.client.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.account.findMany({
      where: { deletedAt: null, hidden: false },
      include: {
        product: { select: { id: true, name: true, color: true, imageUrl: true } },
        provider: { select: { id: true, name: true } },
        profiles: {
          where: { deletedAt: null },
          include: { client: { select: { id: true, name: true, phone: true } } },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { email: "asc" }
    }),
    prisma.combo.findMany({
      where: { deletedAt: null, active: true },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, color: true, imageUrl: true } } },
          orderBy: { product: { name: "asc" } }
        }
      },
      orderBy: { name: "asc" }
    }),
    getReportData()
  ]);

  return (
    <AppShell
      initialData={{
        user: {
          ...user,
          accessUntil: user.accessUntil?.toISOString() || null
        },
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          link: product.link,
          imageUrl: product.imageUrl,
          color: product.color,
          priceCents: product.priceCents,
          costCents: product.costCents,
          maxProfiles: product.maxProfiles,
          provider: product.provider
        })),
        providers: providers.map((provider) => ({
          id: provider.id,
          name: provider.name,
          contact: provider.contact,
          supportPhone: provider.supportPhone,
          paymentPhone: provider.paymentPhone,
          notes: provider.notes,
          offers: provider.offers.map((offer) => ({
            id: offer.id,
            productId: offer.productId,
            costCents: offer.costCents,
            product: offer.product
          }))
        })),
        clients: clients.map((client) => ({
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          notes: client.notes,
          status: client.status
        })),
        accounts: accounts.map((account) => ({
          id: account.id,
          email: account.email,
          password: account.password,
          purchaseCents: account.purchaseCents,
          hidden: account.hidden,
          product: account.product,
          provider: account.provider,
          billingDate: account.billingDate.toISOString(),
          profiles: account.profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            pin: profile.pin,
            soldCents: profile.soldCents,
            client: profile.client,
            dueDate: profile.dueDate.toISOString()
          }))
        })),
        combos: combos.map((combo) => ({
          id: combo.id,
          name: combo.name,
          saleCents: combo.saleCents,
          costCents: combo.costCents,
          notes: combo.notes,
          items: combo.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            product: item.product
          }))
        })),
        report
      }}
    />
  );
}

async function getReportData() {
  const [accounts, clients, movements] = await Promise.all([
    prisma.account.findMany({
      where: { deletedAt: null },
      include: {
        product: { select: { name: true } },
        provider: { select: { name: true } },
        profiles: { where: { deletedAt: null } }
      }
    }),
    prisma.client.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.movement.findMany({ orderBy: { date: "desc" }, take: 200 })
  ]);

  const investedCents = accounts.reduce((sum, account) => sum + account.purchaseCents, 0);
  const soldCents = accounts.reduce((sum, account) => sum + account.profiles.reduce((inner, profile) => inner + profile.soldCents, 0), 0);

  return {
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
    movements: movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      concept: movement.concept,
      amountCents: movement.amountCents,
      date: movement.date.toISOString(),
      createdAt: movement.createdAt.toISOString()
    }))
  };
}
