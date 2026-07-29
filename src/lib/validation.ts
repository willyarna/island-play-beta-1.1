import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(6).max(120)
});

export const providerSchema = z.object({
  name: z.string().min(2).max(120),
  contact: z.string().max(160).optional().nullable(),
  supportPhone: z.string().max(40).optional().nullable(),
  paymentPhone: z.string().max(40).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  offers: z.array(z.object({
    productId: z.string().min(1),
    costCents: z.number().int().min(0)
  })).default([])
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  link: z.string().max(1000).optional().or(z.literal("")),
  imageUrl: z.string().max(8_000_000).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#e50914"),
  priceCents: z.number().int().min(0).default(0),
  costCents: z.number().int().min(0).default(0),
  maxProfiles: z.number().int().min(1).max(20).default(5),
  providerId: z.string().optional().nullable()
});

export const comboSchema = z.object({
  name: z.string().min(2).max(160),
  saleCents: z.number().int().min(0),
  costCents: z.number().int().min(0),
  notes: z.string().max(1000).optional().nullable(),
  productIds: z.array(z.string().min(1)).min(2).max(20)
});

const comboSaleClientSchema = z.object({
  name: z.string().min(2).max(140),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().max(1000).optional().nullable()
});

const comboSaleItemSchema = z.object({
  productId: z.string().min(1),
  mode: z.enum(["EXISTING", "CREATE"]).default("EXISTING"),
  accountId: z.string().optional().nullable(),
  profileId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  email: z.string().max(180).optional().nullable(),
  password: z.string().max(180).optional().nullable(),
  purchaseCents: z.number().int().min(0).default(0),
  profileName: z.string().min(1).max(80),
  pin: z.string().max(30).optional().nullable(),
  dueDate: z.string().date(),
  soldCents: z.number().int().min(0)
});

export const comboSaleSchema = z.object({
  comboId: z.string().min(1),
  clientId: z.string().optional().nullable(),
  client: comboSaleClientSchema.optional().nullable(),
  dueDate: z.string().date(),
  totalSaleCents: z.number().int().min(0),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(comboSaleItemSchema).min(2).max(20)
}).refine((input) => Boolean(input.clientId || input.client?.name), {
  message: "Selecciona un cliente existente o crea uno nuevo para vender el combo.",
  path: ["clientId"]
});

export const individualSaleSchema = z.object({
  productId: z.string().min(1),
  mode: z.enum(["EXISTING", "CREATE"]).default("EXISTING"),
  accountId: z.string().optional().nullable(),
  profileId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  client: comboSaleClientSchema.optional().nullable(),
  email: z.string().max(180).optional().nullable(),
  password: z.string().max(180).optional().nullable(),
  purchaseCents: z.number().int().min(0).default(0),
  soldCents: z.number().int().min(0),
  profileName: z.string().min(1).max(80),
  pin: z.string().max(30).optional().nullable(),
  dueDate: z.string().date(),
  notes: z.string().max(1000).optional().nullable()
}).refine((input) => Boolean(input.clientId || input.client?.name), {
  message: "Selecciona un cliente existente o crea uno nuevo para vender el servicio.",
  path: ["clientId"]
});

export const clientSchema = z.object({
  name: z.string().min(2).max(140),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("INACTIVE")
});

const profileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  pin: z.string().max(30).optional().nullable(),
  clientId: z.string().optional().nullable(),
  dueDate: z.string().date(),
  soldCents: z.number().int().min(0)
});

export const accountSchema = z.object({
  productId: z.string(),
  providerId: z.string().optional().nullable(),
  email: z.string().min(3).max(180),
  password: z.string().min(1).max(180),
  notes: z.string().max(1000).optional().nullable(),
  billingDate: z.string().date(),
  purchaseCents: z.number().int().min(0),
  hidden: z.boolean().default(false),
  profiles: z.array(profileSchema).min(1).max(20)
});

export const movementSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  concept: z.string().min(2).max(600),
  amountCents: z.number().int().min(0),
  date: z.string().date()
});

export const movementUpdateSchema = movementSchema.extend({
  id: z.string().min(1)
});

export const settingsSchema = z.object({
  credits: z.number().int().min(0),
  accessUntil: z.string().date().optional().nullable(),
  whatsappConnected: z.boolean(),
  n8nWebhook: z.string().url().optional().or(z.literal("")).nullable(),
  reminderDays: z.number().int().min(0).max(30),
  template: z.string().min(10).max(3000)
});
