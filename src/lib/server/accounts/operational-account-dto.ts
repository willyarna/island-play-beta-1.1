import "server-only";

import type { Prisma } from "@prisma/client";

export const deliveryClientSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  notes: true,
  status: true
} as const satisfies Prisma.ClientSelect;

export const operationalProfileSelect = {
  id: true,
  name: true,
  pin: true,
  dueDate: true,
  soldCents: true,
  client: {
    select: {
      id: true,
      name: true,
      phone: true
    }
  }
} as const satisfies Prisma.ProfileSelect;

export const operationalAccountSelect = {
  id: true,
  email: true,
  password: true,
  billingDate: true,
  purchaseCents: true,
  hidden: true,
  product: {
    select: {
      id: true,
      name: true,
      color: true,
      imageUrl: true
    }
  },
  provider: {
    select: {
      id: true,
      name: true
    }
  },
  profiles: {
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: operationalProfileSelect
  }
} as const satisfies Prisma.AccountSelect;

type OperationalAccountSource = Prisma.AccountGetPayload<{
  select: typeof operationalAccountSelect;
}>;

type OperationalProfileSource = OperationalAccountSource["profiles"][number];

type DeliveryClientSource = Prisma.ClientGetPayload<{
  select: typeof deliveryClientSelect;
}>;

export type OperationalProfileDto = {
  id: string;
  name: string;
  pin: string | null;
  dueDate: string;
  soldCents: number;
  client: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
};

export type OperationalAccountDto = {
  id: string;
  email: string;
  password: string;
  billingDate: string;
  purchaseCents: number;
  hidden: boolean;
  product: {
    id: string;
    name: string;
    color: string;
    imageUrl: string | null;
  };
  provider: {
    id: string;
    name: string;
  } | null;
  profiles: OperationalProfileDto[];
};

export type DeliveryClientDto = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
};

function toOperationalProfileDto(profile: OperationalProfileSource): OperationalProfileDto {
  return {
    id: profile.id,
    name: profile.name,
    pin: profile.pin,
    dueDate: profile.dueDate.toISOString(),
    soldCents: profile.soldCents,
    client: profile.client
      ? {
          id: profile.client.id,
          name: profile.client.name,
          phone: profile.client.phone
        }
      : null
  };
}

function toDeliveryClientDto(client: DeliveryClientSource): DeliveryClientDto {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
    status: client.status
  };
}

export function toOperationalAccountDto(account: OperationalAccountSource): OperationalAccountDto {
  return {
    id: account.id,
    email: account.email,
    password: account.password,
    billingDate: account.billingDate.toISOString(),
    purchaseCents: account.purchaseCents,
    hidden: account.hidden,
    product: {
      id: account.product.id,
      name: account.product.name,
      color: account.product.color,
      imageUrl: account.product.imageUrl
    },
    provider: account.provider
      ? {
          id: account.provider.id,
          name: account.provider.name
        }
      : null,
    profiles: account.profiles.map(toOperationalProfileDto)
  };
}

export function toIndividualSaleDeliveryDto(input: {
  client: DeliveryClientSource;
  profileId: string | null;
  account: OperationalAccountSource;
}) {
  return {
    client: toDeliveryClientDto(input.client),
    profileId: input.profileId,
    account: toOperationalAccountDto(input.account)
  };
}

export function toComboSaleDeliveryDto(input: {
  client: DeliveryClientSource;
  entries: ReadonlyArray<{
    account: OperationalAccountSource;
    profileId: string | null;
  }>;
}) {
  return {
    client: toDeliveryClientDto(input.client),
    entries: input.entries.map((entry) => ({
      account: toOperationalAccountDto(entry.account),
      profileId: entry.profileId
    }))
  };
}
