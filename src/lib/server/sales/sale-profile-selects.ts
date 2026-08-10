import "server-only";

import type { Prisma } from "@prisma/client";

export const individualSaleProfileSelect = {
  id: true,
  accountId: true,
  clientId: true,
  soldCents: true,
  account: {
    select: {
      email: true,
      productId: true,
      deletedAt: true
    }
  }
} as const satisfies Prisma.ProfileSelect;

export const comboSaleProfileSelect = {
  id: true,
  accountId: true,
  clientId: true,
  account: {
    select: {
      productId: true,
      deletedAt: true
    }
  }
} as const satisfies Prisma.ProfileSelect;
