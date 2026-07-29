import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@larsaplay.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@larsaplay.local",
      passwordHash,
      role: UserRole.ADMIN,
      accessUntil: addDays(3650)
    }
  });

  const provider = await prisma.provider.upsert({
    where: { id: "seed-provider-main" },
    update: {},
    create: {
      id: "seed-provider-main",
      name: "Proveedor Principal",
      contact: "WhatsApp",
      supportPhone: "+573000000001",
      paymentPhone: "+573000000002",
      notes: "Proveedor demo para la beta"
    }
  });

  const netflix = await prisma.product.upsert({
    where: { id: "seed-product-netflix" },
    update: {},
    create: {
      id: "seed-product-netflix",
      name: "NETFLIX",
      link: "https://www.netflix.com",
      color: "#e50914",
      priceCents: 1200000,
      costCents: 890000,
      maxProfiles: 5,
      providerId: provider.id
    }
  });

  await prisma.providerOffer.upsert({
    where: { id: "seed-offer-provider-netflix" },
    update: { costCents: 890000, active: true, deletedAt: null },
    create: {
      id: "seed-offer-provider-netflix",
      providerId: provider.id,
      productId: netflix.id,
      costCents: 890000
    }
  });

  const client = await prisma.client.create({
    data: {
      name: "Cliente Demo",
      phone: "+573000000000",
      email: "cliente@demo.com",
      status: "ACTIVE"
    }
  });

  await prisma.account.create({
    data: {
      productId: netflix.id,
      providerId: provider.id,
      email: "demo.netflix@larsaplay.local",
      password: "demo1234",
      notes: "Cuenta demo sembrada",
      billingDate: addDays(30),
      purchaseCents: 890000,
      profiles: {
        create: [
          { name: "crypsux", pin: "1302", dueDate: addDays(30), soldCents: 1200000, status: "OCCUPIED", clientId: client.id },
          { name: "Perfil 2", pin: "2222", dueDate: addDays(30) },
          { name: "Perfil 3", pin: "3333", dueDate: addDays(30) },
          { name: "Perfil 4", pin: "4444", dueDate: addDays(30) },
          { name: "Perfil 5", pin: "5555", dueDate: addDays(30) }
        ]
      }
    }
  });

  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      credits: 0,
      accessUntil: addDays(25),
      reminderDays: 2,
      template: "Hola {{cliente}}, tu servicio {{servicio}} vence el {{vence}}. Correo: {{correo}} Contraseña: {{password}} Perfil: {{perfil}} PIN: {{pin}}."
    }
  });

  await prisma.movement.createMany({
    data: [
      { type: "INCOME", concept: "Venta NETFLIX Cliente Demo", amountCents: 1200000, date: new Date() },
      { type: "EXPENSE", concept: "Compra proveedor NETFLIX", amountCents: 890000, date: new Date() }
    ]
  });

  console.log(`Seed listo para ${admin.email}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
