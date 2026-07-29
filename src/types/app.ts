export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  accessUntil: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  link: string | null;
  imageUrl: string | null;
  color: string;
  priceCents: number;
  costCents: number;
  maxProfiles: number;
  provider?: { id: string; name: string } | null;
};

export type ProviderRow = {
  id: string;
  name: string;
  contact: string | null;
  supportPhone: string | null;
  paymentPhone: string | null;
  notes: string | null;
  offers: Array<{
    id: string;
    productId: string;
    costCents: number;
    product: {
      id: string;
      name: string;
      color: string;
      imageUrl: string | null;
    };
  }>;
};

export type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type AccountRow = {
  id: string;
  email: string;
  password: string;
  billingDate: string;
  purchaseCents: number;
  hidden: boolean;
  product: { id: string; name: string; color: string; imageUrl: string | null };
  provider: { id: string; name: string } | null;
  profiles: Array<{
    id: string;
    name: string;
    pin: string | null;
    dueDate: string;
    soldCents: number;
    client: { id: string; name: string; phone: string | null } | null;
  }>;
};

export type ComboRow = {
  id: string;
  name: string;
  saleCents: number;
  costCents: number;
  notes: string | null;
  items: Array<{
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      color: string;
      imageUrl: string | null;
    };
  }>;
};
