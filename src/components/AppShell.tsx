"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  Copy,
  CreditCard,
  Layers3,
  Edit3,
  Eye,
  EyeOff,
  Handshake,
  ImagePlus,
  LinkIcon,
  LogOut,
  LockKeyhole,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  PackagePlus,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  ShoppingCart,
  Smartphone,
  Store,
  Sun,
  Type,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TrendingUp,
  UserRound,
  UserRoundCheck,
  Users,
  Wifi
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProductBadge } from "@/components/ProductBadge";
import type { AccountRow, ClientRow, ComboRow, ProductRow, ProviderRow, SessionUser } from "@/types/app";

type View = "store" | "movements" | "accounts" | "clients" | "services" | "providers" | "connection" | "reports" | "profile" | "sales";
type AppView = View;
type ProfileTab = "general" | "account" | "security" | "sessions";
type ThemeMode = "dark" | "light";
type FontSizeMode = "sm" | "md" | "lg";
type AccentMode = "pink" | "purple" | "teal" | "cyan";
type TemplateMode = "reminder" | "delivery";
type TemplateLibrary = {
  reminder: string[];
  delivery: string[];
  conditions: string;
  productSelection: Record<string, { reminder: number; delivery: number }>;
};
type ComboPreset = {
  id: string;
  name: string;
  services: string[];
  costCents: number;
  saleCents: number;
  notes?: string;
};

const DEFAULT_USAGE_CONDITIONS =
  `📌 *Condiciones de uso*\n✅ Usa solo el perfil asignado.\n🚫 No cambies contraseña ni correo.\n🚫 No edites ni crees perfiles.\n🚫 No compartas la cuenta.\n🛟 Soporte: 10:00 a.m. - 10:00 p.m.\n💙 Gracias por elegirnos.`;

const DEFAULT_REMINDER_TEMPLATES = [
  `⏰ *Recordatorio Island Play*\n\nHola {{cliente}} 👋\nTu servicio *{{nombre_servicio}}* vence el *{{fecha_vencimiento}}*.\n\nPara evitar cortes, puedes renovar hoy y enviar el comprobante de pago a *{{cuenta_pago}}*.\n\n{{condiciones_uso}}`,
  `⏰ *Recordatorio de combo Island Play*\n\nHola {{cliente}} 👋\nTu combo vence el *{{fecha_vencimiento}}*.\n\nServicios incluidos:\n{{servicios_combo}}\n\nPara mantener todo activo, puedes renovar hoy y enviar el comprobante a *{{cuenta_pago}}*.\n\n{{condiciones_uso}}`
];

const DEFAULT_DELIVERY_TEMPLATES = [
  `✨ *¡Bienvenido a Island Play!* 🌴\n\nTu cuenta de *{{nombre_servicio}}* ya está activa.\n\n📧 *Correo:* {{correo}}\n🔑 *Contraseña:* {{contraseña}}\n👤 *Perfil:* {{perfil}}\n🔐 *PIN:* {{pin}}\n📅 *Vence:* {{fecha_vencimiento}}\n\n{{condiciones_uso}}`,
  `✨ *¡Bienvenido a Island Play!* 🌴\n\nTu combo ya está activo. Estos son tus accesos:\n\n{{servicios_combo}}\n\n{{condiciones_uso}}`
];

const TEMPLATE_SLOT_LABELS: Record<TemplateMode, string[]> = {
  reminder: ["Cuenta individual", "Combo"],
  delivery: ["Cuenta individual", "Combo"]
};

const DEFAULT_TEMPLATE_LIBRARY: TemplateLibrary = {
  reminder: DEFAULT_REMINDER_TEMPLATES,
  delivery: DEFAULT_DELIVERY_TEMPLATES,
  conditions: DEFAULT_USAGE_CONDITIONS,
  productSelection: {}
};

const TEMPLATE_STORAGE_KEY = "island-template-library-v3";

function loadTemplateLibraryFromStorage() {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE_LIBRARY;
  const storedTemplates = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (!storedTemplates) return DEFAULT_TEMPLATE_LIBRARY;
  const trimmedTemplates = storedTemplates.trim();
  if (!trimmedTemplates.startsWith("{")) {
    window.localStorage.removeItem(TEMPLATE_STORAGE_KEY);
    return DEFAULT_TEMPLATE_LIBRARY;
  }

  try {
    const parsed = JSON.parse(trimmedTemplates) as Partial<TemplateLibrary>;
    return {
      reminder: mergeTemplateSlots(parsed.reminder, DEFAULT_REMINDER_TEMPLATES),
      delivery: mergeTemplateSlots(parsed.delivery, DEFAULT_DELIVERY_TEMPLATES),
      conditions: typeof parsed.conditions === "string" && parsed.conditions.trim() ? parsed.conditions : DEFAULT_USAGE_CONDITIONS,
      productSelection: parsed.productSelection && typeof parsed.productSelection === "object" ? parsed.productSelection : {}
    };
  } catch {
    window.localStorage.removeItem(TEMPLATE_STORAGE_KEY);
    return DEFAULT_TEMPLATE_LIBRARY;
  }
}

function comboPreset(id: number, name: string, services: string[], costPesos: number, salePesos: number, notes?: string): ComboPreset {
  return {
    id: `combo-${id}`,
    name,
    services,
    costCents: costPesos * 100,
    saleCents: salePesos * 100,
    notes
  };
}

const COMBO_PRESETS: ComboPreset[] = [
  comboPreset(1, "Netflix + Disney+", ["Netflix", "Disney+"], 17100, 22000),
  comboPreset(2, "Netflix + Max", ["Netflix", "Max"], 12800, 18500),
  comboPreset(3, "Netflix + Prime Video", ["Netflix", "Prime Video"], 12100, 18000),
  comboPreset(4, "Netflix + ViX", ["Netflix", "ViX"], 10600, 16000),
  comboPreset(5, "Disney+ + Prime Video", ["Disney+", "Prime Video"], 12000, 18000),
  comboPreset(6, "Disney+ + Max", ["Disney+", "Max"], 12700, 18000),
  comboPreset(7, "Disney+ + ViX", ["Disney+", "ViX"], 10500, 16000),
  comboPreset(8, "Prime Video + Max", ["Prime Video", "Max"], 7700, 14000),
  comboPreset(9, "Netflix + Crunchyroll", ["Netflix", "Crunchyroll"], 12500, 17500),
  comboPreset(10, "Disney+ + Crunchyroll", ["Disney+", "Crunchyroll"], 12400, 17500),
  comboPreset(11, "Max + ViX", ["Max", "ViX"], 6200, 13000),
  comboPreset(12, "Max + Crunchyroll", ["Max", "Crunchyroll"], 8100, 15000),
  comboPreset(13, "Prime Video + ViX", ["Prime Video", "ViX"], 5500, 12000),
  comboPreset(14, "Prime Video + Crunchyroll", ["Prime Video", "Crunchyroll"], 7400, 13000),
  comboPreset(15, "ViX + Crunchyroll", ["ViX", "Crunchyroll"], 5900, 13000),
  comboPreset(16, "Disney+ + Paramount+", ["Disney+", "Paramount+"], 14000, 20000),
  comboPreset(17, "Netflix + Disney+ + Prime Video", ["Netflix", "Disney+", "Prime Video"], 20600, 26000),
  comboPreset(18, "Netflix + Disney+ + ViX", ["Netflix", "Disney+", "ViX"], 19100, 25000),
  comboPreset(19, "Netflix + Max + Prime Video", ["Netflix", "Max", "Prime Video"], 16300, 22000),
  comboPreset(20, "Netflix + Paramount+ + Prime Video", ["Netflix", "Paramount+", "Prime Video"], 17600, 24000),
  comboPreset(21, "Netflix + Max + ViX", ["Netflix", "Max", "ViX"], 14800, 22000),
  comboPreset(22, "Disney+ + Max + Prime Video", ["Disney+", "Max", "Prime Video"], 16200, 25000),
  comboPreset(23, "Disney+ + Max + ViX", ["Disney+", "Max", "ViX"], 14700, 22000),
  comboPreset(24, "Netflix + Disney+ + Crunchyroll", ["Netflix", "Disney+", "Crunchyroll"], 21000, 30000),
  comboPreset(25, "Netflix + Disney+ + Prime Video + Max", ["Netflix", "Disney+", "Prime Video", "Max"], 24800, 35000),
  comboPreset(26, "Netflix + Crunchyroll + Paramount+ + Max", ["Netflix", "Crunchyroll", "Paramount+", "Max"], 22200, 35000),
  comboPreset(27, "Netflix + Disney+ + Max + ViX", ["Netflix", "Disney+", "Max", "ViX"], 23300, 36000),
  comboPreset(28, "Netflix + ViX + Max + Paramount+", ["Netflix", "ViX", "Max", "Paramount+"], 20300, 32000),
  comboPreset(29, "Prime Video + Disney+ + Max + Crunchyroll", ["Prime Video", "Disney+", "Max", "Crunchyroll"], 20100, 32000),
  comboPreset(30, "Netflix + Disney+ + Prime Video + Paramount+ + Max", ["Netflix", "Disney+", "Prime Video", "Paramount+", "Max"], 30300, 45000),
  comboPreset(31, "Todo Incluido", ["Netflix", "Disney+", "Max", "Prime Video", "Crunchyroll", "ViX", "Paramount+"], 36200, 52000, "Combo premium con las 7 plataformas principales.")
];

type BootstrapData = {
  user: SessionUser;
  products: ProductRow[];
  providers: ProviderRow[];
  clients: ClientRow[];
  accounts: AccountRow[];
  combos: ComboRow[];
  report: {
    summary: {
      activeClients: number;
      accounts: number;
      investedCents: number;
      soldCents: number;
      profitCents: number;
    };
    accounts: Array<{ id: string; product: string; provider: string | null; purchaseCents: number; soldCents: number; profitCents: number }>;
    movements: Array<{ id: string; type: "INCOME" | "EXPENSE"; concept: string; amountCents: number; date: string; createdAt: string }>;
  };
};

type MovementRow = BootstrapData["report"]["movements"][number];
type DeliveryEntry = {
  account: AccountRow;
  profile?: AccountRow["profiles"][number];
};

type AccountDraft = {
  productId: string;
  providerId: string;
  email: string;
  password: string;
  notes: string;
  billingDate: string;
  purchaseCents: number;
  hidden: boolean;
  profiles: Array<{
    name: string;
    pin: string;
    clientId: string;
    dueDate: string;
    soldCents: number;
  }>;
};

type ProductDraft = {
  name: string;
  maxProfiles: number;
  link: string;
  imageUrl: string;
  color: string;
};

type ClientDraft = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: "ACTIVE" | "INACTIVE";
};

type ProviderDraft = {
  name: string;
  contact: string;
  supportPhone: string;
  paymentPhone: string;
  notes: string;
  offers: Array<{
    productId: string;
    costCents: number;
  }>;
};

type ComboDraft = {
  name: string;
  productIds: string[];
  saleCents: number;
  costCents: number;
  notes: string;
};

type ComboSaleDraft = {
  comboId: string;
  clientId: string;
  client: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  dueDate: string;
  totalSaleCents: number;
  notes: string;
  items: Array<{
    productId: string;
    mode: "EXISTING" | "CREATE";
    accountId: string;
    profileId: string;
    providerId: string;
    email: string;
    password: string;
    purchaseCents: number;
    profileName: string;
    pin: string;
    dueDate: string;
    soldCents: number;
  }>;
};

type IndividualSaleDraft = {
  productId: string;
  mode: "EXISTING" | "CREATE";
  accountId: string;
  profileId: string;
  providerId: string;
  clientId: string;
  client: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
  email: string;
  password: string;
  purchaseCents: number;
  soldCents: number;
  profileName: string;
  pin: string;
  dueDate: string;
  notes: string;
};

type MovementDraft = {
  type: "INCOME" | "EXPENSE";
  concept: string;
  amountCents: number;
  date: string;
};

const nav: Array<[AppView, string, LucideIcon]> = [
  ["store", "Inicio", Store],
  ["movements", "Finanzas", TrendingUp],
  ["accounts", "Cuentas", Monitor],
  ["clients", "Clientes", Users],
  ["services", "Servicios", PackagePlus],
  ["providers", "Proveedores", Handshake],
  ["sales", "Ventas", ShoppingCart],
  ["connection", "Conexión", MessageCircle]
];

export function AppShell({ initialData }: { initialData: BootstrapData }) {
  const [view, setView] = useState<AppView>("accounts");
  const [profileTab, setProfileTab] = useState<ProfileTab>("general");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [fontSizeMode, setFontSizeMode] = useState<FontSizeMode>("md");
  const [accentMode, setAccentMode] = useState<AccentMode>("pink");
  const [products, setProducts] = useState(initialData.products);
  const [providers, setProviders] = useState(initialData.providers);
  const [clients, setClients] = useState(initialData.clients);
  const [accounts, setAccounts] = useState(initialData.accounts);
  const [combos, setCombos] = useState(initialData.combos);
  const [report, setReport] = useState(initialData.report);
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [accountOrder, setAccountOrder] = useState<
    "email-asc" | "email-desc" | "billing-asc" | "billing-desc" | "profiles-expired" | "profiles-expiring" | "profiles-available" | "account-expiration"
  >("email-asc");
  const [accountStatusFilter, setAccountStatusFilter] = useState<"all" | "expired" | "empty">("all");
  const [showHiddenAccounts, setShowHiddenAccounts] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [individualSaleModalOpen, setIndividualSaleModalOpen] = useState(false);
  const [comboSaleModalOpen, setComboSaleModalOpen] = useState(false);
  const [selectedSaleComboId, setSelectedSaleComboId] = useState("");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [deliveryAccount, setDeliveryAccount] = useState<AccountRow | null>(null);
  const [clientDelivery, setClientDelivery] = useState<{ client: ClientRow | null; entries: DeliveryEntry[]; title?: string } | null>(null);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [editingProvider, setEditingProvider] = useState<ProviderRow | null>(null);
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);
  const [editingCombo, setEditingCombo] = useState<ComboRow | null>(null);
  const [editingMovement, setEditingMovement] = useState<MovementRow | null>(null);
  const [templateProduct, setTemplateProduct] = useState<{ product: ProductRow; mode: TemplateMode } | null>(null);
  const [templateLibrary, setTemplateLibrary] = useState<TemplateLibrary>(DEFAULT_TEMPLATE_LIBRARY);
  const [productAccounts, setProductAccounts] = useState<ProductRow | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientRow | null>(null);
  const [profileEditor, setProfileEditor] = useState<{ account: AccountRow; profile: AccountRow["profiles"][number]; index: number } | null>(null);
  const [assignmentDelivery, setAssignmentDelivery] = useState<{
    account: AccountRow;
    profile: AccountRow["profiles"][number];
    client: ClientRow | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [servicesTab, setServicesTab] = useState<"products" | "combos">("products");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountPageSize, setAccountPageSize] = useState(100);
  const [accountPage, setAccountPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(100);
  const [clientPage, setClientPage] = useState(1);

  useEffect(() => {
    const storedTheme = localStorage.getItem("larsa-theme") as ThemeMode | null;
    const storedSize = localStorage.getItem("larsa-font-size") as FontSizeMode | null;
    const storedAccent = localStorage.getItem("larsa-accent") as AccentMode | null;
    if (storedTheme === "dark" || storedTheme === "light") setThemeMode(storedTheme);
    if (storedSize === "sm" || storedSize === "md" || storedSize === "lg") setFontSizeMode(storedSize);
    if (storedAccent === "pink" || storedAccent === "purple" || storedAccent === "teal" || storedAccent === "cyan") setAccentMode(storedAccent);
    setTemplateLibrary(loadTemplateLibraryFromStorage());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.dataset.fontSize = fontSizeMode;
    document.documentElement.dataset.accent = accentMode;
    localStorage.setItem("larsa-theme", themeMode);
    localStorage.setItem("larsa-font-size", fontSizeMode);
    localStorage.setItem("larsa-accent", accentMode);
  }, [accentMode, fontSizeMode, themeMode]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templateLibrary));
  }, [templateLibrary]);

  const filteredAccounts = useMemo(() => {
    const filtered = accounts.filter((account) => {
      const service = productFilter === "all" || account.product.id === productFilter;
      const text = `${account.email} ${account.product.name}`.toLowerCase().includes(query.toLowerCase());
      const profilesExpired = account.profiles.some((profile) => profile.client && daysLeft(profile.dueDate) <= 0);
      const profilesExpiring = account.profiles.some((profile) => profile.client && daysLeft(profile.dueDate) > 0 && daysLeft(profile.dueDate) <= 5);
      const profilesAvailable = account.profiles.some((profile) => !profile.client);
      const orderFilter =
        (accountOrder !== "profiles-expired" && accountOrder !== "profiles-expiring" && accountOrder !== "profiles-available") ||
        (accountOrder === "profiles-expired" && profilesExpired) ||
        (accountOrder === "profiles-expiring" && profilesExpiring) ||
        (accountOrder === "profiles-available" && profilesAvailable);
      const status =
        accountStatusFilter === "all" ||
        (accountStatusFilter === "expired" && daysLeft(account.billingDate) <= 0) ||
        (accountStatusFilter === "empty" && !account.profiles.some((profile) => profile.client));
      return service && text && status && orderFilter;
    });

    return filtered.sort((a, b) => {
      if (accountOrder === "email-desc") return b.email.localeCompare(a.email);
      if (accountOrder === "billing-asc" || accountOrder === "account-expiration" || accountOrder === "profiles-expired" || accountOrder === "profiles-expiring") return new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime();
      if (accountOrder === "billing-desc") return new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime();
      return a.email.localeCompare(b.email);
    });
  }, [accounts, accountOrder, accountStatusFilter, productFilter, query]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => `${client.name} ${client.phone || ""} ${client.email || ""}`.toLowerCase().includes(query.toLowerCase()));
  }, [clients, query]);

  const pagedAccounts = useMemo(() => paginate(filteredAccounts, accountPage, accountPageSize), [accountPage, accountPageSize, filteredAccounts]);
  const pagedClients = useMemo(() => paginate(filteredClients, clientPage, clientPageSize), [clientPage, clientPageSize, filteredClients]);

  async function refresh() {
    const accountUrl = showHiddenAccounts ? "/api/accounts?hidden=true" : "/api/accounts";
    const [accountRes, productRes, providerRes, clientRes, comboRes, reportRes] = await Promise.all([
      fetch(accountUrl),
      fetch("/api/products"),
      fetch("/api/providers"),
      fetch("/api/clients"),
      fetch("/api/combos"),
      fetch("/api/reports")
    ]);
    setAccounts((await accountRes.json()).accounts);
    setProducts((await productRes.json()).products);
    setProviders((await providerRes.json()).providers);
    setClients((await clientRes.json()).clients);
    setCombos((await comboRes.json()).combos);
    setReport(await reportRes.json());
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  async function createProduct(draft: ProductDraft) {
    await saveProduct(draft);
  }

  async function saveProduct(draft: ProductDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id, providerId: null, priceCents: 0, costCents: 0 })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const details = Array.isArray(data.issues)
          ? `\n\n${data.issues.map((issue: { path?: string[]; message?: string }) => `${issue.path?.join(".") || "campo"}: ${issue.message}`).join("\n")}`
          : "";
        window.alert(`${data.error || "No se pudo guardar el servicio."}${details}`);
        return;
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function createProvider(draft: ProviderDraft) {
    await saveProvider(draft);
  }

  async function createCombo(draft: ComboDraft) {
    await saveCombo(draft);
  }

  async function saveCombo(draft: ComboDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/combos", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id })
      });
      if (!response.ok) throw new Error("No se pudo guardar el combo.");
      await refresh();
      setComboModalOpen(false);
      setEditingCombo(null);
      setMessage(id ? "Combo actualizado correctamente." : "Combo creado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error guardando combo.");
    } finally {
      setSaving(false);
    }
  }

  async function saveComboSale(draft: ComboSaleDraft) {
    setSaving(true);
    try {
      const response = await fetch("/api/combo-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          clientId: draft.clientId || null,
          client: draft.clientId ? null : draft.client
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo registrar la venta del combo.");
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        delivery?: {
          client: ClientRow | null;
          entries: Array<{ account?: AccountRow; profileId?: string | null }>;
        };
      };
      await refresh();
      setComboSaleModalOpen(false);
      setSelectedSaleComboId("");
      if (payload.delivery?.entries?.length) {
        setClientDelivery({
          client: payload.delivery.client,
          title: "Combo registrado, datos listos para enviar",
          entries: payload.delivery.entries
            .filter((entry): entry is { account: AccountRow; profileId?: string | null } => Boolean(entry.account))
            .map((entry) => ({
              account: entry.account,
              profile: entry.account.profiles.find((profile) => profile.id === entry.profileId) || entry.account.profiles.find((profile) => profile.client?.id === payload.delivery?.client?.id)
            }))
        });
      }
      setMessage("Venta combo registrada: cliente activo, perfiles asignados y movimiento financiero creado.");
    } finally {
      setSaving(false);
    }
  }

  async function saveIndividualSale(draft: IndividualSaleDraft) {
    setSaving(true);
    try {
      const response = await fetch("/api/individual-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          accountId: draft.accountId || null,
          profileId: draft.profileId || null,
          providerId: draft.providerId || null,
          clientId: draft.clientId || null,
          client: draft.clientId ? null : draft.client
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo registrar la venta individual.");
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        delivery?: {
          client: ClientRow | null;
          profileId?: string | null;
          account?: AccountRow;
        } | null;
      };
      await refresh();
      setIndividualSaleModalOpen(false);
      if (payload.delivery?.account) {
        const profile =
          payload.delivery.account.profiles.find((item) => item.id === payload.delivery?.profileId) ||
          payload.delivery.account.profiles.find((item) => item.client?.id === payload.delivery?.client?.id);
        setAssignmentDelivery({ account: payload.delivery.account, profile: profile || payload.delivery.account.profiles[0], client: payload.delivery.client });
      }
      setMessage("Venta individual registrada: cliente activo, perfil asignado y movimiento financiero creado.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMovement(draft: MovementDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/movements", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ...draft, id } : draft)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo guardar el movimiento.");
        return;
      }
      await refresh();
      setMovementModalOpen(false);
      setEditingMovement(null);
      setMessage(id ? "Movimiento actualizado correctamente." : draft.type === "INCOME" ? "Venta manual registrada en finanzas." : "Gasto manual registrado en finanzas.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovement(movement: MovementRow) {
    if (!window.confirm(`¿Eliminar este movimiento?\n\n${movement.concept}\n${money(movement.amountCents)}`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/movements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: movement.id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo eliminar el movimiento.");
        return;
      }
      await refresh();
      setMessage("Movimiento eliminado de finanzas.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProvider(draft: ProviderDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/providers", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo guardar el proveedor.");
        return;
      }
      setProviderModalOpen(false);
      setEditingProvider(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function createClient(draft: ClientDraft) {
    await saveClient(draft);
  }

  async function saveClient(draft: ClientDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo guardar el cliente.");
        return;
      }
      setClientModalOpen(false);
      setEditingClient(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function previewWhatsApp() {
    const response = await fetch("/api/whatsapp/preview", { method: "POST" });
    const data = await response.json();
    setMessage(data.message || data.error);
  }

  async function createAccount(draft: AccountDraft) {
    await saveAccount(draft);
  }

  async function saveAccount(draft: AccountDraft, id?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/accounts", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo guardar la cuenta.");
        return;
      }

      setAccountModalOpen(false);
      setEditingAccount(null);
      setProfileEditor(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveProfileAssignment(
    context: { account: AccountRow; profile: AccountRow["profiles"][number]; index: number },
    nextProfile: AccountDraft["profiles"][number]
  ) {
    setSaving(true);
    try {
      const draft = accountToDraft(context.account);
      draft.profiles[context.index] = nextProfile;
      const response = await fetch("/api/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, id: context.account.id })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo guardar el perfil.");
        return;
      }

      const client = clients.find((item) => item.id === nextProfile.clientId) || null;
      const updatedProfile: AccountRow["profiles"][number] = {
        ...context.profile,
        name: nextProfile.name,
        pin: nextProfile.pin,
        dueDate: `${nextProfile.dueDate}T00:00:00.000Z`,
        soldCents: nextProfile.soldCents,
        client: client ? { id: client.id, name: client.name, phone: client.phone } : null
      };
      const updatedAccount: AccountRow = {
        ...context.account,
        profiles: context.account.profiles.map((profile, index) => (index === context.index ? updatedProfile : profile))
      };

      setProfileEditor(null);
      await refresh();
      if (client) {
        setAssignmentDelivery({ account: updatedAccount, profile: updatedProfile, client });
      } else {
        setMessage("Perfil actualizado correctamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntity(kind: "products" | "providers" | "clients" | "accounts" | "combos", id: string, label: string) {
    if (!window.confirm(`¿Eliminar ${label}? Esta acción lo ocultará de la plataforma.`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/${kind}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudo eliminar.");
        return;
      }
      await refresh();
      setMessage(`${label} eliminado correctamente.`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedClients() {
    if (!selectedClientIds.length) return;
    const selectedClients = clients.filter((client) => selectedClientIds.includes(client.id));
    const activeClients = selectedClients.filter((client) => client.status === "ACTIVE");
    if (activeClients.length) {
      setMessage(`No se pueden eliminar clientes activos. Primero quite sus perfiles o cuentas asignadas: ${activeClients.map((client) => client.name).join(", ")}`);
      return;
    }
    if (!window.confirm(`¿Eliminar ${selectedClientIds.length} clientes seleccionados? También se liberarán sus perfiles asignados.`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedClientIds })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "No se pudieron eliminar los clientes seleccionados.");
        return;
      }
      setSelectedClientIds([]);
      await refresh();
      setMessage(`${selectedClientIds.length} clientes eliminados correctamente.`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(client: ClientRow) {
    if (client.status === "ACTIVE") {
      setMessage(`No se puede eliminar el cliente ${client.name} porque está activo. Primero quite sus perfiles o cuentas asignadas.`);
      return;
    }
    await deleteEntity("clients", client.id, `el cliente ${client.name}`);
  }

  function accountHasAssignedClients(account: AccountRow) {
    return account.profiles.some((profile) => profile.client);
  }

  async function deleteAccount(account: AccountRow) {
    if (accountHasAssignedClients(account)) {
      setMessage("No se puede eliminar esa cuenta ya que tiene un cliente o varios clientes asignados. Primero debe eliminar los clientes para poderla eliminar del sistema.");
      return;
    }
    await deleteEntity("accounts", account.id, `la cuenta ${account.email}`);
  }

  async function deleteSelectedAccounts() {
    if (!selectedAccountIds.length) return;
    const selectedAccounts = accounts.filter((account) => selectedAccountIds.includes(account.id));
    const blocked = selectedAccounts.filter(accountHasAssignedClients);
    if (blocked.length) {
      setMessage(`No se puede eliminar esa cuenta ya que tiene un cliente o varios clientes asignados. Primero debe eliminar los clientes para poderla eliminar del sistema: ${blocked.map((account) => account.email).join(", ")}`);
      return;
    }
    if (!window.confirm(`¿Eliminar ${selectedAccountIds.length} cuentas seleccionadas? Solo se eliminarán cuentas vacías.`)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedAccountIds })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error || "No se pudieron eliminar las cuentas seleccionadas.");
        return;
      }
      const count = selectedAccountIds.length;
      setSelectedAccountIds([]);
      await refresh();
      setMessage(`${count} cuentas eliminadas correctamente.`);
    } finally {
      setSaving(false);
    }
  }

  async function copyDeliveryMessage(account: AccountRow) {
    const text = buildDeliveryMessage(account, undefined, templateLibrary);
    await navigator.clipboard?.writeText(text);
    setMessage("Mensaje copiado al portapapeles.");
  }

  function saveTemplate(mode: TemplateMode, slot: number, text: string, conditions: string) {
    const templateLabel = TEMPLATE_SLOT_LABELS[mode][slot] || `Plantilla ${slot + 1}`;
    const defaults = mode === "reminder" ? DEFAULT_REMINDER_TEMPLATES : DEFAULT_DELIVERY_TEMPLATES;
    setTemplateLibrary((current) => ({
      ...current,
      [mode]: mergeTemplateSlots(current[mode], defaults).map((item, index) => (index === slot ? text : item)),
      conditions: conditions.trim() || DEFAULT_USAGE_CONDITIONS,
      productSelection: current.productSelection
    }));
    setTemplateProduct(null);
    setMessage(`${templateLabel} guardada como plantilla global para ${mode === "reminder" ? "notificaciones" : "envío de datos"}.`);
  }

  async function copyText(text: string, success = "Texto copiado al portapapeles.") {
    await navigator.clipboard?.writeText(text);
    setMessage(success);
  }

  function openProfileAction(account: AccountRow, profile: AccountRow["profiles"][number], index: number) {
    if (profile.client?.id) {
      const fullClient = clients.find((client) => client.id === profile.client?.id);
      if (fullClient) {
        setClientDetail(fullClient);
        return;
      }
    }
    setProfileEditor({ account, profile, index });
  }

  async function removeProfileClient(account: AccountRow, profile: AccountRow["profiles"][number]) {
    const index = account.profiles.findIndex((item) => item.id === profile.id);
    if (index < 0) return;
    if (!window.confirm(`¿Quitar a ${profile.client?.name || "este cliente"} del perfil ${profile.name}?`)) return;
    setClientDetail(null);
    await saveProfileAssignment(
      { account, profile, index },
      {
        name: profile.name,
        pin: profile.pin || "",
        clientId: "",
        dueDate: dateInput(profile.dueDate),
        soldCents: 0
      }
    );
  }

  function exportAccountsXlsx() {
    exportRowsXlsx(
      "cuentas.xlsx",
      "Cuentas",
      filteredAccounts.map((account, index) => ({
        "#": index + 1,
        Servicio: account.product.name,
        Correo: account.email,
        Contraseña: account.password,
        Perfiles: `${account.profiles.filter((profile) => profile.client).length}/${account.profiles.length}`,
        Clientes: account.profiles.map((profile) => profile.client?.name).filter(Boolean).join(", "),
        Facturación: dateOnly(account.billingDate),
        Restantes: `${daysLeft(account.billingDate)} días`,
        "Costo proveedor": money(account.purchaseCents),
        "Venta total": money(account.profiles.reduce((sum, profile) => sum + profile.soldCents, 0))
      }))
    );
  }

  function exportProductsXlsx() {
    exportRowsXlsx(
      "servicios.xlsx",
      "Servicios",
      products.map((product, index) => ({
        "#": index + 1,
        Servicio: product.name,
        "Link producto": product.link || "",
        Precio: money(product.priceCents),
        "Costo proveedor": money(product.costCents),
        "Max perfiles": product.maxProfiles,
        "Cuentas creadas": accounts.filter((account) => account.product.id === product.id).length
      }))
    );
  }

  function exportProvidersXlsx() {
    exportRowsXlsx(
      "proveedores.xlsx",
      "Proveedores",
      providers.flatMap((provider, index) => {
        if (!provider.offers.length) {
          return [{
            "#": index + 1,
            Proveedor: provider.name,
            Contacto: provider.contact || "",
            "WhatsApp soporte": provider.supportPhone || "",
            "WhatsApp pagos": provider.paymentPhone || "",
            Servicio: "",
            Costo: "",
            Observación: provider.notes || ""
          }];
        }
        return provider.offers.map((offer, offerIndex) => ({
          "#": offerIndex === 0 ? index + 1 : "",
          Proveedor: provider.name,
          Contacto: provider.contact || "",
          "WhatsApp soporte": provider.supportPhone || "",
          "WhatsApp pagos": provider.paymentPhone || "",
          Servicio: offer.product.name,
          Costo: money(offer.costCents),
          Observación: provider.notes || ""
        }));
      })
    );
  }

  function exportClientsXlsx() {
    exportRowsXlsx(
      "clientes.xlsx",
      "Clientes",
      filteredClients.map((client, index) => ({
        "#": index + 1,
        Nombre: client.name,
        Celular: client.phone || "",
        Correo: client.email || "",
        Observación: client.notes || "",
        Estado: client.status === "ACTIVE" ? "Activo" : "Inactivo"
      }))
    );
  }

  async function importClientsXlsx(file: File) {
    setSaving(true);
    try {
      const rows = await readFirstSheetXlsx(file);
      const drafts = rows
        .map((row) => {
          const normalized = normalizeImportRow(row);
          const name = normalized.nombre || normalized.name || normalized.cliente;
          const statusText = String(normalized.estado || normalized.status || "").trim().toLowerCase();
          return {
            name: String(name || "").trim(),
            phone: String(normalized.celular || normalized.numero_celular || normalized.telefono || normalized.phone || "").trim(),
            email: String(normalized.correo || normalized.email || "").trim(),
            notes: String(normalized.observacion || normalized.observación || normalized.notes || "").trim(),
            status: statusText === "activo" || statusText === "active" ? "ACTIVE" as const : "INACTIVE" as const
          };
        })
        .filter((draft) => draft.name.length >= 2);

      if (!drafts.length) {
        setMessage("No encontré clientes válidos en el archivo. Usa columnas: Nombre, Celular, Correo, Observación, Estado.");
        return;
      }

      let imported = 0;
      for (const draft of drafts) {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft)
        });
        if (response.ok) imported += 1;
      }

      await refresh();
      setMessage(`Importación terminada: ${imported} de ${drafts.length} clientes creados.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar el archivo XLSX.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    setQuery("");
    setSelectedClientIds([]);
    setSelectedAccountIds([]);
    setAccountPage(1);
    setClientPage(1);
  }, [view]);

  useEffect(() => {
    setAccountPage(1);
    setSelectedAccountIds([]);
  }, [accountOrder, accountStatusFilter, productFilter, query, showHiddenAccounts]);

  useEffect(() => {
    setClientPage(1);
    setSelectedClientIds([]);
  }, [query]);

  useEffect(() => {
    if (view === "accounts") void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHiddenAccounts]);

  return (
    <main className="app-bg grid min-h-screen grid-cols-[252px_1fr] grid-rows-[60px_1fr] max-lg:grid-cols-1">
      <header className="topbar col-span-full flex h-[60px] items-center justify-between border-b border-white/5 px-6 shadow-[0_12px_40px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="status-chip hidden md:flex"><CalendarClock size={14} /> {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</span>
          <button
            type="button"
            className="status-chip transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
            onClick={() => {
              setView("profile");
              setProfileTab("general");
            }}
            title="Abrir perfil del usuario"
          >
            <CalendarClock size={14} /> Vence en 25 días
          </button>
          <span className="credit-chip"><CreditCard size={14} /> 0 Créditos</span>
          <button type="button" className="top-icon-button" title="Configuración" onClick={() => setSettingsOpen(true)}>
            <Settings size={18} />
          </button>
          <button onClick={logout} className="status-chip transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:text-white">
            <LogOut size={14} />
            Salir
          </button>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--accent),#00d267_45%,#1f80e0_70%,#111)] font-bold"
            onClick={() => {
              setView("profile");
              setProfileTab("general");
            }}
            title="Perfil"
          >
            LP
          </button>
        </div>
      </header>

      <aside className="p-0 max-lg:row-auto">
        <nav className="premium-sidebar sticky top-[87px] m-0 grid min-h-[calc(100vh-108px)] w-[250px] content-start gap-2 rounded-r-[18px] px-3 py-7 max-lg:static max-lg:min-h-0 max-lg:w-auto max-lg:grid-cols-2 max-lg:rounded-none">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`nav-item flex h-[45px] items-center gap-4 rounded-[12px] px-5 text-left font-bold ${
                view === id ? "nav-item-active text-white" : "text-[#a6a8ad]"
              }`}
            >
              <Icon size={18} strokeWidth={2.35} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace min-w-0 p-6">
        {view === "accounts" && (
          <>
            <div className="filter-bar mb-5 flex items-end gap-5 max-lg:flex-col max-lg:items-stretch">
              <label className="grid w-[380px] gap-2 max-lg:w-full">
                <span className="text-[11px] text-[#9a9da4]">Servicio</span>
                <select className="input-line" value={productFilter} onChange={(event) => setProductFilter(event.target.value)}>
                  <option value="all">Seleccione un servicio</option>
                  {products.map((product) => (
                    <option value={product.id} key={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid w-[250px] gap-2 max-lg:w-full">
                <span className="text-[11px] text-[#9a9da4]">Ordenar por</span>
                <select className="input-line" value={accountOrder} onChange={(event) => setAccountOrder(event.target.value as typeof accountOrder)}>
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="profiles-expired">Perfiles Vencidos</option>
                  <option value="profiles-expiring">Perfiles por vencer</option>
                  <option value="profiles-available">Perfiles Disponibles</option>
                  <option value="account-expiration">Vencimiento de cuenta</option>
                  <option value="billing-asc">Facturación próxima</option>
                  <option value="billing-desc">Facturación lejana</option>
                </select>
              </label>
              <label className="grid w-[260px] gap-2 max-lg:w-full">
                <span className="text-[11px] text-[#9a9da4]">Filtrar cuentas</span>
                <select className="input-line" value={accountStatusFilter} onChange={(event) => setAccountStatusFilter(event.target.value as typeof accountStatusFilter)}>
                  <option value="all">Todas las cuentas</option>
                  <option value="expired">Cuentas vencidas</option>
                  <option value="empty">Sin usuarios asignados</option>
                </select>
              </label>
              <button
                type="button"
                className={`hidden-toggle ${showHiddenAccounts ? "hidden-toggle-on" : ""}`}
                onClick={() => setShowHiddenAccounts((current) => !current)}
              >
                {showHiddenAccounts ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                Ver cuentas ocultas
              </button>
            </div>
            <Panel title="Listado de cuentas" action={<button className="btn-green" onClick={() => setAccountModalOpen(true)}><Plus size={16} /> Nuevo</button>} query={query} setQuery={setQuery} onExport={exportAccountsXlsx}>
              {selectedAccountIds.length ? (
                <div className="bulk-action-bar mb-4">
                  <span>{selectedAccountIds.length} cuenta{selectedAccountIds.length === 1 ? "" : "s"} seleccionada{selectedAccountIds.length === 1 ? "" : "s"}</span>
                  <div className="flex gap-2">
                    <button type="button" className="btn-outline-blue" onClick={() => setSelectedAccountIds([])}>Limpiar selección</button>
                    <button type="button" className="btn-pink" disabled={saving} onClick={() => void deleteSelectedAccounts()}>
                      <Trash2 size={16} /> Eliminar seleccionadas
                    </button>
                  </div>
                </div>
              ) : null}
              <AccountsTable
                accounts={pagedAccounts.items}
                selectedIds={selectedAccountIds}
                setSelectedIds={setSelectedAccountIds}
                startIndex={pagedAccounts.startIndex}
                onOpenDelivery={setDeliveryAccount}
                onEdit={setEditingAccount}
                onDelete={(account) => void deleteAccount(account)}
                onProfileEdit={openProfileAction}
              />
              <PaginationControls
                total={filteredAccounts.length}
                page={accountPage}
                pageSize={accountPageSize}
                onPageChange={setAccountPage}
                onPageSizeChange={(size) => {
                  setAccountPageSize(size);
                  setAccountPage(1);
                  setSelectedAccountIds([]);
                }}
              />
            </Panel>
          </>
        )}

        {view === "services" && (
          <>
            <div className="mb-7 flex flex-wrap gap-4 border-b border-[#22f2ff]/10 pb-4">
              <button
                className={`service-switch ${servicesTab === "products" ? "active" : ""}`}
                onClick={() => setServicesTab("products")}
              >
                <PackagePlus size={22} /> Servicios de streaming
              </button>
              <button
                className={`service-switch ${servicesTab === "combos" ? "active" : ""}`}
                onClick={() => setServicesTab("combos")}
              >
                <Layers3 size={22} /> Combos
              </button>
            </div>
            {servicesTab === "products" ? (
              <Panel title="Listado de servicios de streaming" action={<button className="btn-green" onClick={() => setProductModalOpen(true)}><Plus size={16} /> Nuevo</button>} query={query} setQuery={setQuery} onExport={exportProductsXlsx}>
                <ProductsTable
                  products={products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))}
                  accounts={accounts}
                  onReminder={(product) => setTemplateProduct({ product, mode: "reminder" })}
                  onDelivery={(product) => setTemplateProduct({ product, mode: "delivery" })}
                  onAccounts={setProductAccounts}
                  onEdit={setEditingProduct}
                  onDelete={(product) => void deleteEntity("products", product.id, `el servicio ${product.name}`)}
                />
              </Panel>
            ) : (
              <Panel
                title="Catálogo de combos"
                action={<button className="btn-green" onClick={() => setComboModalOpen(true)}><Plus size={16} /> Nuevo combo</button>}
                query={query}
                setQuery={setQuery}
                onExport={() =>
                  exportRowsXlsx(
                    "combos-island-play.xlsx",
                    "Combos",
                    combos.map((combo, index) => ({
                      "#": index + 1,
                      Combo: combo.name,
                      Servicios: combo.items.map((item) => item.product.name).join(" + "),
                      "Costo referencia": combo.costCents / 100,
                      "Precio venta": combo.saleCents / 100,
                      Ganancia: (combo.saleCents - combo.costCents) / 100,
                      Margen: `${Math.round(((combo.saleCents - combo.costCents) / Math.max(combo.saleCents, 1)) * 100)}%`
                    }))
                  )
                }
              >
                <CombosTable
                  combos={combos.filter((combo) => `${combo.name} ${combo.items.map((item) => item.product.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))}
                  onEdit={setEditingCombo}
                  onDelete={(combo) => void deleteEntity("combos", combo.id, `el combo ${combo.name}`)}
                />
              </Panel>
            )}
          </>
        )}

        {view === "clients" && (
          <Panel
            title="Listado de clientes"
            action={<button className="btn-green" onClick={() => setClientModalOpen(true)}><UserRoundCheck size={16} /> Nuevo</button>}
            query={query}
            setQuery={setQuery}
            onExport={exportClientsXlsx}
            onImport={(file) => void importClientsXlsx(file)}
            extraAction={<><CloudUpload size={15} /> Importar</>}
          >
            {selectedClientIds.length ? (
              <div className="bulk-action-bar mb-4">
                <span>{selectedClientIds.length} cliente{selectedClientIds.length === 1 ? "" : "s"} seleccionado{selectedClientIds.length === 1 ? "" : "s"}</span>
                <div className="flex gap-2">
                  <button type="button" className="btn-outline-blue" onClick={() => setSelectedClientIds([])}>Limpiar selección</button>
                  <button type="button" className="btn-pink" disabled={saving} onClick={() => void deleteSelectedClients()}>
                    <Trash2 size={16} /> Eliminar seleccionados
                  </button>
                </div>
              </div>
            ) : null}
            <ClientsTable
              clients={pagedClients.items}
              selectedIds={selectedClientIds}
              setSelectedIds={setSelectedClientIds}
              startIndex={pagedClients.startIndex}
              onWhatsApp={(client) => {
                if (client.phone) window.open(`https://wa.me/${client.phone.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
                else setMessage("Este cliente no tiene número de WhatsApp registrado.");
              }}
              onDetail={setClientDetail}
              onEdit={setEditingClient}
              onDelete={(client) => void deleteClient(client)}
            />
            <PaginationControls
              total={filteredClients.length}
              page={clientPage}
              pageSize={clientPageSize}
              onPageChange={setClientPage}
              onPageSizeChange={(size) => {
                setClientPageSize(size);
                setClientPage(1);
                setSelectedClientIds([]);
              }}
            />
          </Panel>
        )}

        {view === "providers" && (
          <Panel
            title="Listado de proveedores"
            action={<button className="btn-green" onClick={() => setProviderModalOpen(true)}><Handshake size={16} /> Nuevo</button>}
            query={query}
            setQuery={setQuery}
            onExport={exportProvidersXlsx}
          >
            <ProvidersTable
              providers={providers.filter((provider) =>
                `${provider.name} ${provider.contact || ""} ${provider.supportPhone || ""} ${provider.paymentPhone || ""} ${provider.notes || ""} ${provider.offers.map((offer) => offer.product.name).join(" ")}`
                  .toLowerCase()
                  .includes(query.toLowerCase())
              )}
              onEdit={setEditingProvider}
              onDelete={(provider) => void deleteEntity("providers", provider.id, `el proveedor ${provider.name}`)}
            />
          </Panel>
        )}

        {view === "sales" && (
          <Panel
            title="Centro de ventas"
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <button className="btn-blue" onClick={() => setIndividualSaleModalOpen(true)}><Monitor size={16} /> Vender servicio individual</button>
                <button className="btn-green" onClick={() => { setSelectedSaleComboId(""); setComboSaleModalOpen(true); }}><ShoppingCart size={16} /> Vender combo</button>
              </div>
            }
            query={query}
            setQuery={setQuery}
          >
            <div className="grid grid-cols-12 gap-4">
              <article className="premium-card col-span-5 rounded-[22px] p-5 max-lg:col-span-12">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#19e6ff]">Venta asistida</p>
                <h2 className="mt-2 text-2xl font-black">Vende sin volver a pasar por hojas de cálculo</h2>
                <p className="mt-2 text-sm text-[#a8adba]">
                  Desde aquí eliges si estás vendiendo una plataforma individual o un combo ya creado. La venta registra cliente,
                  perfiles, costo real de proveedor, ingreso y ganancia para Finanzas.
                </p>
                <div className="mt-5 grid gap-3">
                  <button className="btn-blue justify-center" onClick={() => setIndividualSaleModalOpen(true)}><Monitor size={16} /> Venta individual</button>
                  <button className="btn-green justify-center" onClick={() => { setSelectedSaleComboId(""); setComboSaleModalOpen(true); }}><ShoppingCart size={16} /> Venta de combo</button>
                </div>
              </article>
              <article className="premium-card col-span-7 rounded-[22px] p-5 max-lg:col-span-12">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">Combos listos para vender</h3>
                    <p className="text-sm text-[#9a9da4]">Los precios se editan desde Servicios → Combos.</p>
                  </div>
                  <span className="profit-pill">{combos.length} combos</span>
                </div>
                <div className="grid max-h-[420px] gap-3 overflow-auto pr-1">
                  {combos
                    .filter((combo) => `${combo.name} ${combo.items.map((item) => item.product.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
                    .map((combo) => (
                      <button
                        key={combo.id}
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#19e6ff]/40 hover:bg-[#19e6ff]/10"
                        onClick={() => {
                          setSelectedSaleComboId(combo.id);
                          setComboSaleModalOpen(true);
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <b>{combo.name}</b>
                          <span className="profit-pill">{money(combo.saleCents)}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#9a9da4]">{combo.items.map((item) => item.product.name).join(" + ")}</p>
                      </button>
                    ))}
                  {!combos.length ? <p className="rounded-2xl border border-white/10 p-4 text-[#9a9da4]">Crea combos primero en Servicios → Combos.</p> : null}
                </div>
              </article>
            </div>
          </Panel>
        )}

        {view === "store" && (
          <HomeDashboard
            products={products}
            accounts={accounts}
            clients={clients}
            report={report}
            onGoAccounts={() => setView("accounts")}
            onGoSales={() => setView("sales")}
          />
        )}

        {view === "reports" && <Reports report={report} onNewMovement={() => setMovementModalOpen(true)} onEditMovement={setEditingMovement} onDeleteMovement={deleteMovement} />}

        {view === "connection" && (
          <section className="grid grid-cols-12 gap-4">
            <div className="premium-card col-span-5 rounded-[18px] p-5 max-lg:col-span-12">
              <h2 className="text-lg font-bold">Conexión WhatsApp</h2>
              <div className="mx-auto my-6 grid aspect-square w-[240px] place-items-center rounded-lg border border-[#3b3f48] text-[#9a9da4]">QR pendiente</div>
              <button onClick={previewWhatsApp} className="btn-green w-full"><Wifi size={16} /> Previsualizar plantilla</button>
            </div>
            <div className="premium-card col-span-7 rounded-[18px] p-5 max-lg:col-span-12">
              <h2 className="text-lg font-bold">Mensaje</h2>
              <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-[#15181e] p-4 text-sm text-[#e8e9ec]">{message || "Genera una vista previa para revisar la plantilla."}</pre>
            </div>
          </section>
        )}

        {view === "movements" && <Reports report={report} onNewMovement={() => setMovementModalOpen(true)} onEditMovement={setEditingMovement} onDeleteMovement={deleteMovement} />}

        {view === "profile" && (
          <ProfileView
            user={initialData.user}
            tab={profileTab}
            setTab={setProfileTab}
            onMessage={setMessage}
          />
        )}
      </section>
      {settingsOpen ? (
        <SettingsDrawer
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          fontSizeMode={fontSizeMode}
          setFontSizeMode={setFontSizeMode}
          accentMode={accentMode}
          setAccentMode={setAccentMode}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
      {accountModalOpen ? (
        <AccountModal
          products={products}
          providers={providers}
          clients={clients}
          saving={saving}
          onClose={() => setAccountModalOpen(false)}
          onSave={createAccount}
        />
      ) : null}
      {deliveryAccount ? (
        <DeliveryModal
          account={deliveryAccount}
          templateLibrary={templateLibrary}
          onClose={() => setDeliveryAccount(null)}
          onCopy={() => copyDeliveryMessage(deliveryAccount)}
          onNotify={() => {
            const assignedProfile = deliveryAccount.profiles.find((profile) => profile.client?.phone);
            const url = whatsappUrl(assignedProfile?.client?.phone, buildDeliveryMessage(deliveryAccount, assignedProfile, templateLibrary));
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else setMessage("Esta cuenta no tiene un cliente con WhatsApp asignado. Asigna primero un perfil a un cliente.");
          }}
        />
      ) : null}
      {clientDelivery ? (
        <ClientDeliveryModal
          title={clientDelivery.title}
          client={clientDelivery.client}
          entries={clientDelivery.entries}
          templateLibrary={templateLibrary}
          onClose={() => setClientDelivery(null)}
          onCopy={() => void copyText(buildClientDeliveryMessage(clientDelivery.entries, templateLibrary, clientDelivery.client), "Datos completos del cliente copiados.")}
          onNotify={() => {
            const url = whatsappUrl(clientDelivery.client?.phone, buildClientDeliveryMessage(clientDelivery.entries, templateLibrary, clientDelivery.client));
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else setMessage("Este cliente no tiene número de WhatsApp. Copia el texto y envíalo manualmente.");
          }}
        />
      ) : null}
      {productModalOpen ? (
        <ProductModal saving={saving} onClose={() => setProductModalOpen(false)} onSave={createProduct} />
      ) : null}
      {editingProduct ? (
        <ProductModal
          product={editingProduct}
          saving={saving}
          onClose={() => setEditingProduct(null)}
          onSave={(draft) => saveProduct(draft, editingProduct.id)}
        />
      ) : null}
      {providerModalOpen ? (
        <ProviderModal products={products} saving={saving} onClose={() => setProviderModalOpen(false)} onSave={createProvider} />
      ) : null}
      {editingProvider ? (
        <ProviderModal
          provider={editingProvider}
          products={products}
          saving={saving}
          onClose={() => setEditingProvider(null)}
          onSave={(draft) => saveProvider(draft, editingProvider.id)}
        />
      ) : null}
      {clientModalOpen ? (
        <ClientModal saving={saving} onClose={() => setClientModalOpen(false)} onSave={createClient} />
      ) : null}
      {comboModalOpen ? (
        <ComboModal products={products} saving={saving} onClose={() => setComboModalOpen(false)} onSave={createCombo} />
      ) : null}
      {comboSaleModalOpen ? (
        <ComboSaleModal
          combos={combos}
          accounts={accounts}
          providers={providers}
          clients={clients}
          initialComboId={selectedSaleComboId}
          saving={saving}
          onClose={() => {
            setComboSaleModalOpen(false);
            setSelectedSaleComboId("");
          }}
          onSave={saveComboSale}
        />
      ) : null}
      {individualSaleModalOpen ? (
        <IndividualSaleModal
          products={products}
          accounts={accounts}
          providers={providers}
          clients={clients}
          saving={saving}
          onClose={() => setIndividualSaleModalOpen(false)}
          onSave={saveIndividualSale}
        />
      ) : null}
      {movementModalOpen || editingMovement ? (
        <MovementModal
          movement={editingMovement || undefined}
          saving={saving}
          onClose={() => {
            setMovementModalOpen(false);
            setEditingMovement(null);
          }}
          onSave={(draft) => saveMovement(draft, editingMovement?.id)}
        />
      ) : null}
      {editingCombo ? (
        <ComboModal
          combo={editingCombo}
          products={products}
          saving={saving}
          onClose={() => setEditingCombo(null)}
          onSave={(draft) => saveCombo(draft, editingCombo.id)}
        />
      ) : null}
      {editingClient ? (
        <ClientModal
          client={editingClient}
          saving={saving}
          onClose={() => setEditingClient(null)}
          onSave={(draft) => saveClient(draft, editingClient.id)}
        />
      ) : null}
      {editingAccount ? (
        <AccountModal
          account={editingAccount}
          products={products}
          providers={providers}
          clients={clients}
          saving={saving}
          onClose={() => setEditingAccount(null)}
          onSave={(draft) => saveAccount(draft, editingAccount.id)}
        />
      ) : null}
      {templateProduct ? (
        <TemplateModal
          product={templateProduct.product}
          mode={templateProduct.mode}
          library={templateLibrary}
          onClose={() => setTemplateProduct(null)}
          onCopy={(text) => void copyText(text, "Plantilla copiada.")}
          onSave={(slot, text, conditions) => saveTemplate(templateProduct.mode, slot, text, conditions)}
        />
      ) : null}
      {productAccounts ? (
        <ProductAccountsModal
          product={productAccounts}
          accounts={accounts.filter((account) => account.product.id === productAccounts.id)}
          onClose={() => setProductAccounts(null)}
          onOpenDelivery={setDeliveryAccount}
        />
      ) : null}
      {clientDetail ? (
        <ClientDetailModal
          client={clientDetail}
          accounts={accounts}
          onClose={() => setClientDetail(null)}
          onCopyProfile={(account, profile) => void copyText(buildDeliveryMessage(account, profile, templateLibrary), "Datos del perfil copiados.")}
          onNotifyProfile={(account, profile) => {
            const url = whatsappUrl(profile.client?.phone, buildDeliveryMessage(account, profile, templateLibrary));
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else setMessage("Este cliente no tiene número de WhatsApp registrado.");
          }}
          onEditProfile={(account, profile) => {
            const index = account.profiles.findIndex((item) => item.id === profile.id);
            if (index >= 0) {
              setClientDetail(null);
              setProfileEditor({ account, profile, index });
            }
          }}
          onRemoveProfile={(account, profile) => void removeProfileClient(account, profile)}
        />
      ) : null}
      {profileEditor ? (
        <ProfileAssignmentModal
          account={profileEditor.account}
          profile={profileEditor.profile}
          profileIndex={profileEditor.index}
          clients={clients}
          providers={providers}
          combos={combos}
          saving={saving}
          onClose={() => setProfileEditor(null)}
          onSave={(nextProfile) => void saveProfileAssignment(profileEditor, nextProfile)}
        />
      ) : null}
      {assignmentDelivery ? (
        <DeliveryModal
          account={assignmentDelivery.account}
          profile={assignmentDelivery.profile}
          client={assignmentDelivery.client}
          templateLibrary={templateLibrary}
          title="Cliente registrado, movimiento generado"
          onClose={() => setAssignmentDelivery(null)}
          onCopy={() => void copyText(buildDeliveryMessage(assignmentDelivery.account, assignmentDelivery.profile, templateLibrary), "Datos listos para enviar copiados.")}
          onNotify={() => {
            const url = whatsappUrl(assignmentDelivery.client?.phone, buildDeliveryMessage(assignmentDelivery.account, assignmentDelivery.profile, templateLibrary));
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            else setMessage("Cliente registrado, pero no tiene número para abrir WhatsApp.");
          }}
        />
      ) : null}
      {message ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-[380px] rounded-lg border border-[#3b3f48] bg-[#2b2f38] p-4 text-white shadow-2xl">
          <button className="float-right ml-3 text-[#9a9da4]" onClick={() => setMessage(null)}>×</button>
          {message}
        </div>
      ) : null}
    </main>
  );
}

function ProfileView({
  user,
  tab,
  setTab,
  onMessage
}: {
  user: SessionUser;
  tab: ProfileTab;
  setTab: (tab: ProfileTab) => void;
  onMessage: (message: string) => void;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const accessDate = user.accessUntil || new Date(Date.now() + 25 * 86400000).toISOString();
  const remaining = daysLeft(accessDate);
  const profileName = user.name || "Tukystream";
  const tabs: Array<[ProfileTab, string, LucideIcon]> = [
    ["general", "General", UserRound],
    ["account", "Cuenta", CreditCard],
    ["security", "Seguridad", LockKeyhole],
    ["sessions", "Sesiones", Monitor]
  ];

  return (
    <section className="profile-page">
      <div className="profile-hero premium-panel">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">LP</div>
          <button className="profile-import"><ImagePlus size={14} /> Importar</button>
        </div>
        <div className="profile-title">
          <h1>{profileName}</h1>
          <p>{user.role === "ADMIN" ? "Administrador" : "Usuario"}</p>
        </div>
        <nav className="profile-tabs" aria-label="Perfil">
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={`profile-tab ${tab === id ? "profile-tab-active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "general" ? (
        <form
          className="profile-card premium-card"
          onSubmit={(event) => {
            event.preventDefault();
            onMessage("Datos del perfil actualizados para esta beta.");
          }}
        >
          <label className="profile-field">
            <span>Correo</span>
            <input className="input-line" defaultValue={user.email} />
          </label>
          <label className="profile-field">
            <span>Número celular</span>
            <input className="input-line" placeholder="+57 300 000 0000" />
          </label>
          <label className="profile-field">
            <span>Zona horaria</span>
            <select className="input-line" defaultValue="America/Bogota -05:00">
              <option>America/Bogota -05:00</option>
              <option>America/New_York -04:00</option>
              <option>America/Mexico_City -06:00</option>
              <option>America/Lima -05:00</option>
            </select>
          </label>
          <label className="profile-field">
            <span>Moneda</span>
            <select className="input-line" defaultValue="$ Peso colombiano COP">
              <option>$ Peso colombiano COP</option>
              <option>$ Dólar estadounidense USD</option>
              <option>$ Peso mexicano MXN</option>
              <option>S/ Sol peruano PEN</option>
            </select>
          </label>
          <button className="btn-green profile-submit">Actualizar datos</button>
        </form>
      ) : null}

      {tab === "account" ? (
        <section className="profile-card premium-card">
          <h2>Plan actual</h2>
          <p>Su Plan Actual es <span className="mini-chip">Básico</span></p>
          <p>Un comienzo simple para todos</p>
          <div className="mt-5">
            <b>Activo hasta el {new Date(accessDate).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</b>
            <p className="text-[#d6d8df]">Le enviaremos una notificación al vencimiento de la Suscripción</p>
          </div>
          <div className="profile-progress mt-5"><span style={{ width: `${Math.max(8, Math.min(100, remaining * 4))}%` }} /></div>
          <div className="text-right text-[#00d267]">Vence en {remaining} días</div>
          <label className="mt-5 flex items-center gap-3 text-[#ffb300]">
            <input type="checkbox" defaultChecked />
            Auto Renovación
          </label>
          <div className="warning-strip mt-4">
            <Bell size={20} />
            Recarga créditos para renovar tu cuenta, o comunícate con tu proveedor.
          </div>
        </section>
      ) : null}

      {tab === "security" ? (
        <form
          className="profile-card premium-card"
          onSubmit={(event) => {
            event.preventDefault();
            onMessage("Contraseña actualizada para esta beta.");
          }}
        >
          {["Contraseña actual *", "Nueva contraseña *", "Confirmar contraseña *"].map((label) => (
            <label className="profile-field profile-password" key={label}>
              <span>{label}</span>
              <input className="input-line pr-10" type={passwordVisible ? "text" : "password"} />
              <button type="button" onClick={() => setPasswordVisible((current) => !current)} title="Mostrar u ocultar contraseña">
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
          ))}
          <button className="btn-green profile-submit">Actualizar contraseña</button>
        </form>
      ) : null}

      {tab === "sessions" ? (
        <section className="profile-card premium-card sessions-card">
          <h2>Sesiones abiertas</h2>
          {[
            { icon: Monitor, active: false, ago: "Hace 2 horas", action: "Cerrar sesión" },
            { icon: Monitor, active: true, ago: "Hace 6 días", action: "(Sesión actual)" },
            { icon: Smartphone, active: false, ago: "Hace 6 días", action: "Cerrar sesión" }
          ].map(({ icon: Icon, active, ago, action }, index) => (
            <div className="session-row" key={`${ago}-${index}`}>
              <span className={`session-status ${active ? "session-status-active" : ""}`} />
              <Icon size={28} />
              <div>
                <strong>181.237.69.24</strong>
                <small>{ago}</small>
              </div>
              {active ? <span className="session-current">{action}</span> : <button className="session-close">{action}</button>}
            </div>
          ))}
        </section>
      ) : null}
    </section>
  );
}

function SettingsDrawer({
  themeMode,
  setThemeMode,
  fontSizeMode,
  setFontSizeMode,
  accentMode,
  setAccentMode,
  onClose
}: {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  fontSizeMode: FontSizeMode;
  setFontSizeMode: (mode: FontSizeMode) => void;
  accentMode: AccentMode;
  setAccentMode: (mode: AccentMode) => void;
  onClose: () => void;
}) {
  return (
    <>
      <button className="settings-scrim" type="button" aria-label="Cerrar configuración" onClick={onClose} />
      <aside className="settings-drawer">
        <button className="settings-back" onClick={onClose} type="button">←</button>
        <div className="settings-group">
          <span>Tema</span>
          <div className="segmented-control">
            <button className={themeMode === "light" ? "segment-active" : ""} onClick={() => setThemeMode("light")}><Sun size={17} /> CLARO</button>
            <button className={themeMode === "dark" ? "segment-active" : ""} onClick={() => setThemeMode("dark")}><Moon size={17} /> OSCURO</button>
          </div>
        </div>
        <div className="settings-group">
          <span>Tamaño</span>
          <div className="segmented-control">
            <button className={fontSizeMode === "sm" ? "segment-active" : ""} onClick={() => setFontSizeMode("sm")}><Type size={15} /> A−</button>
            <button className={fontSizeMode === "md" ? "segment-active" : ""} onClick={() => setFontSizeMode("md")}><Type size={15} /> A</button>
            <button className={fontSizeMode === "lg" ? "segment-active" : ""} onClick={() => setFontSizeMode("lg")}><Type size={15} /> A+</button>
          </div>
        </div>
        <div className="settings-group">
          <span>Color primario</span>
          <div className="accent-grid">
            {[
              ["pink", "#ff174f"],
              ["purple", "#b719ff"],
              ["teal", "#34c4ba"],
              ["cyan", "#10d8ee"]
            ].map(([id, color]) => (
              <button
                key={id}
                className={`accent-swatch ${accentMode === id ? "accent-swatch-active" : ""}`}
                style={{ "--swatch": color } as React.CSSProperties}
                onClick={() => setAccentMode(id as AccentMode)}
                aria-label={`Color ${id}`}
              />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

function Panel({
  title,
  action,
  extraAction,
  query,
  setQuery,
  onExport,
  onImport,
  children
}: {
  title: string;
  action: React.ReactNode;
  extraAction?: React.ReactNode;
  query: string;
  setQuery: (value: string) => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  children: React.ReactNode;
}) {
  const importRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="premium-panel rounded-[20px] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      <div className="my-7 flex items-center justify-between">
        <div className="flex gap-3">
          <button type="button" className="btn-outline-blue" onClick={onExport}><CloudDownload size={15} /> Exportar</button>
          {onImport ? (
            <>
              <button type="button" className="btn-outline-green" onClick={() => importRef.current?.click()}>{extraAction || <><CloudUpload size={15} /> Importar</>}</button>
              <input
                ref={importRef}
                className="hidden"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onImport(file);
                  event.currentTarget.value = "";
                }}
              />
            </>
          ) : extraAction}
        </div>
        <label className="flex w-[225px] items-center gap-2 text-[#d6d7da]">
          <Search size={16} />
          <input className="input-line" placeholder="Buscar" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <div className="overflow-auto">{children}</div>
    </section>
  );
}

function PaginationControls({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) onPageChange(safePage);
  }, [onPageChange, page, safePage]);

  return (
    <div className="pagination-bar">
      <label className="pagination-size">
        <span>Filas por página:</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
      <span className="pagination-page-label">Página {total === 0 ? 0 : safePage} de {total === 0 ? 0 : totalPages}</span>
      <div className="pagination-arrows">
        <button type="button" onClick={() => onPageChange(Math.max(1, safePage - 1))} disabled={safePage <= 1}>‹</button>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}>›</button>
      </div>
    </div>
  );
}

function AccountsTable({
  accounts,
  selectedIds,
  setSelectedIds,
  startIndex,
  onOpenDelivery,
  onEdit,
  onDelete,
  onProfileEdit
}: {
  accounts: AccountRow[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  startIndex: number;
  onOpenDelivery: (account: AccountRow) => void;
  onEdit: (account: AccountRow) => void;
  onDelete: (account: AccountRow) => void;
  onProfileEdit: (account: AccountRow, profile: AccountRow["profiles"][number], index: number) => void;
}) {
  const visibleIds = accounts.map((account) => account.id);
  const selectedVisible = visibleIds.filter((id) => selectedIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  function toggleAccount(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>
            <label className="row-check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Seleccionar cuentas visibles" />
              <span />
            </label>
          </th>
          <th>#</th><th>Cuenta</th><th>Contraseña</th><th>Perfiles</th><th>Facturación</th><th>Restantes</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map((account, index) => (
          <tr key={account.id} className={selectedIds.includes(account.id) ? "row-selected" : ""}>
            <td>
              <label className="row-check">
                <input type="checkbox" checked={selectedIds.includes(account.id)} onChange={() => toggleAccount(account.id)} aria-label={`Seleccionar ${account.email}`} />
                <span />
              </label>
            </td>
            <td>{startIndex + index + 1}</td>
            <td>
              <div className="flex items-center gap-2">
                <ProductBadge name={account.product.name} color={account.product.color} imageUrl={account.product.imageUrl} />
                <div><b>{account.product.name}</b><small className="block text-[#9b9ea5]">{account.email}</small></div>
              </div>
            </td>
            <td>{account.password}</td>
            <td>
              <div className="flex gap-2">
                {account.profiles.map((profile, profileIndex) => (
                  <button
                    type="button"
                    className={`profile-dot ${profile.client ? "profile-dot-filled" : ""}`}
                    key={profile.id}
                    title={profile.client ? `${profile.name}: ${profile.client.name}` : `${profile.name}: libre`}
                    onClick={() => onProfileEdit(account, profile, profileIndex)}
                  >
                    <UserRound size={15} />
                  </button>
                ))}
              </div>
            </td>
            <td>{dateOnly(account.billingDate)}</td>
            <td><span className={`pill days-pill ${daysPillClass(daysLeft(account.billingDate))}`}>{daysLeft(account.billingDate)} días</span></td>
            <td>
              <div className="flex gap-2 text-base">
                <button className="icon-action text-[#ffb300]" title="Ver mensaje" onClick={() => onOpenDelivery(account)}><Eye size={17} /></button>
                <button className="icon-action text-[#cfd2d8]" title="Editar" onClick={() => onEdit(account)}><Edit3 size={17} /></button>
                <button className="icon-action text-[#ff174f]" title="Eliminar" onClick={() => onDelete(account)}><Trash2 size={17} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AccountModal({
  account,
  products,
  providers,
  clients,
  saving,
  onClose,
  onSave
}: {
  account?: AccountRow;
  products: ProductRow[];
  providers: ProviderRow[];
  clients: ClientRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: AccountDraft) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const initialProduct = account ? products.find((product) => product.id === account.product.id) : products[0];
  const initialProvider = account?.provider?.id || "";
  const [draft, setDraft] = useState<AccountDraft>({
    productId: account?.product.id || products[0]?.id || "",
    providerId: initialProvider,
    email: account?.email || "",
    password: account?.password || "",
    notes: "",
    billingDate: account ? dateInput(account.billingDate) : nextMonth,
    purchaseCents: account?.purchaseCents || initialProduct?.costCents || 0,
    hidden: false,
    profiles: account?.profiles.map((profile) => ({
      name: profile.name,
      pin: profile.pin || "",
      clientId: profile.client?.id || "",
      dueDate: dateInput(profile.dueDate),
      soldCents: profile.soldCents
    })) || Array.from({ length: initialProduct?.maxProfiles || 5 }, (_, index) => ({
      name: `Perfil ${index + 1}`,
      pin: `${1000 + index + 1}`,
      clientId: "",
      dueDate: nextMonth,
      soldCents: 0
    }))
  });

  function patch<K extends keyof AccountDraft>(key: K, value: AccountDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchProfile(index: number, value: Partial<AccountDraft["profiles"][number]>) {
    setDraft((current) => ({
      ...current,
      profiles: current.profiles.map((profile, profileIndex) => (profileIndex === index ? { ...profile, ...value } : profile))
    }));
  }

  function changeProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    const firstOffer = providers.flatMap((provider) => provider.offers.map((offer) => ({ provider, offer }))).find((item) => item.offer.productId === productId);
    setDraft((current) => ({
      ...current,
      productId,
      providerId: firstOffer?.provider.id || "",
      purchaseCents: firstOffer?.offer.costCents ?? product?.costCents ?? current.purchaseCents,
      profiles: Array.from({ length: product?.maxProfiles || 5 }, (_, index) => current.profiles[index] || {
        name: `Perfil ${index + 1}`,
        pin: `${1000 + index + 1}`,
        clientId: "",
        dueDate: current.billingDate,
        soldCents: 0
      })
    }));
  }

  const selectedProduct = products.find((product) => product.id === draft.productId);
  const providerOptions = providers
    .map((provider) => {
      const offer = provider.offers.find((item) => item.productId === draft.productId);
      return offer ? { provider, offer } : null;
    })
    .filter(Boolean) as Array<{ provider: ProviderRow; offer: ProviderRow["offers"][number] }>;

  function changeProvider(providerId: string) {
    const selected = providerOptions.find((item) => item.provider.id === providerId);
    setDraft((current) => ({
      ...current,
      providerId,
      purchaseCents: selected?.offer.costCents ?? current.purchaseCents
    }));
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[155px]">
      <form
        className={`modal-card account-quick-modal relative max-h-[calc(100vh-180px)] w-[min(620px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl ${account ? "account-edit-modal" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-7 text-lg font-medium">{account ? "Editar cuenta" : "Nueva cuenta"}</h2>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[11px] text-[#ff174f]">Servicio *</span>
            <select className="input-line" value={draft.productId} onChange={(event) => changeProduct(event.target.value)} required>
              {!draft.productId ? <option value="">Seleccione un servicio</option> : null}
              {products.map((product) => (
                <option value={product.id} key={product.id}>{product.name}</option>
              ))}
            </select>
            {!account && selectedProduct ? (
              <small className="text-[#b8bcc5]">
                Se crearán {selectedProduct.maxProfiles} perfiles libres automáticamente.
              </small>
            ) : null}
          </label>
          <div className="grid grid-cols-[1.35fr_.65fr] gap-4 max-md:grid-cols-1">
            <label className="grid gap-2">
              <span className="text-[11px] text-[#d0d2d7]">Proveedor de compra</span>
              <select className="input-line" value={draft.providerId} onChange={(event) => changeProvider(event.target.value)}>
                <option value="">Sin proveedor asignado</option>
                {providerOptions.map(({ provider, offer }) => (
                  <option value={provider.id} key={provider.id}>
                    {provider.name} · {money(offer.costCents)}
                  </option>
                ))}
              </select>
              {!providerOptions.length && draft.productId ? (
                <small className="text-[#ffb300]">Este servicio aún no tiene proveedores con precio configurado.</small>
              ) : null}
            </label>
            <label className="grid gap-2">
              <span className="text-[11px] text-[#d0d2d7]">Costo proveedor</span>
              <input className="input-line" type="number" min={0} value={draft.purchaseCents / 100} onChange={(event) => patch("purchaseCents", Math.round(Number(event.target.value || 0) * 100))} />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Usuario/Correo *</span>
            <input className="input-line" value={draft.email} onChange={(event) => patch("email", event.target.value)} required />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Contraseña *</span>
            <input className="input-line" value={draft.password} onChange={(event) => patch("password", event.target.value)} required />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Observación</span>
            <textarea className="input-line min-h-16" value={draft.notes} onChange={(event) => patch("notes", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] text-[#d0d2d7]">Fecha facturación</span>
            <input className="input-line" type="date" min={today} value={draft.billingDate} onChange={(event) => patch("billingDate", event.target.value)} />
          </label>

          {account ? (
            <>
              <section className="grid gap-3">
                <h3 className="text-sm font-semibold">Perfiles</h3>
                {draft.profiles.map((profile, index) => (
                  <div key={index} className="grid grid-cols-[1fr_90px_1.2fr_110px_130px] gap-3 rounded-lg border border-white/10 bg-black/10 p-3 max-lg:grid-cols-1">
                    <label className="grid gap-1">
                      <span className="text-[11px] text-[#cfd2d8]">Perfil</span>
                      <input className="input-line" value={profile.name} onChange={(event) => patchProfile(index, { name: event.target.value })} />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[11px] text-[#cfd2d8]">PIN</span>
                      <input className="input-line" value={profile.pin} onChange={(event) => patchProfile(index, { pin: event.target.value })} />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[11px] text-[#cfd2d8]">Cliente</span>
                      <select className="input-line" value={profile.clientId} onChange={(event) => patchProfile(index, { clientId: event.target.value })}>
                        <option value="">Sin cliente</option>
                        {clients.map((client) => (
                          <option value={client.id} key={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[11px] text-[#cfd2d8]">Vendido</span>
                      <input className="input-line" type="number" min={0} value={profile.soldCents / 100} onChange={(event) => patchProfile(index, { soldCents: Math.round(Number(event.target.value || 0) * 100) })} />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-[11px] text-[#cfd2d8]">Vence</span>
                      <input className="input-line" type="date" value={profile.dueDate} onChange={(event) => patchProfile(index, { dueDate: event.target.value })} />
                    </label>
                  </div>
                ))}
              </section>
            </>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function DeliveryModal({
  account,
  profile,
  client,
  templateLibrary,
  title = "Cliente registrado en la cuenta",
  onClose,
  onCopy,
  onNotify
}: {
  account: AccountRow;
  profile?: AccountRow["profiles"][number];
  client?: ClientRow | null;
  templateLibrary?: TemplateLibrary;
  title?: string;
  onClose: () => void;
  onCopy: () => void;
  onNotify: () => void;
}) {
  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[145px]">
      <section className="modal-card relative max-h-[calc(100vh-170px)] w-[min(520px,calc(100vw-28px))] overflow-auto rounded-[18px] p-7 shadow-2xl">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="success-ring mx-auto grid h-[90px] w-[90px] place-items-center rounded-full"><CheckCircle2 size={58} /></div>
        <h1 className="my-5 text-center text-3xl font-bold leading-tight">{title}</h1>
        {client ? <p className="mb-4 text-center text-[#9a9da4]">{client.name} {client.phone ? `· ${client.phone}` : ""}</p> : null}
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white">{buildDeliveryMessage(account, profile, templateLibrary)}</pre>
        <div className="mt-5 flex justify-center gap-3">
          <button className="btn-blue" onClick={onCopy}><Copy size={16} /> COPIAR</button>
          <button className="btn-green" onClick={onNotify}><Send size={16} /> NOTIFICAR</button>
        </div>
      </section>
    </div>
  );
}

function ClientDeliveryModal({
  title = "Datos del cliente listos para enviar",
  client,
  entries,
  templateLibrary,
  onClose,
  onCopy,
  onNotify
}: {
  title?: string;
  client: ClientRow | null;
  entries: DeliveryEntry[];
  templateLibrary?: TemplateLibrary;
  onClose: () => void;
  onCopy: () => void;
  onNotify: () => void;
}) {
  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[110px]">
      <section className="modal-card relative max-h-[calc(100vh-135px)] w-[min(680px,calc(100vw-28px))] overflow-auto rounded-[22px] p-7 shadow-2xl">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="success-ring mx-auto grid h-[90px] w-[90px] place-items-center rounded-full"><CheckCircle2 size={58} /></div>
        <h1 className="my-4 text-center text-3xl font-black leading-tight">{title}</h1>
        <p className="mb-5 text-center text-[#9a9da4]">
          {client ? `${client.name}${client.phone ? ` · ${client.phone}` : ""}` : "Cliente sin datos completos"}
        </p>
        <div className="rounded-2xl border border-[#19e6ff]/20 bg-[#08131b] p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#19e6ff]">Script único para WhatsApp</p>
          <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-white">
            {buildClientDeliveryMessage(entries, templateLibrary, client)}
          </pre>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button className="btn-blue" onClick={onCopy}><Copy size={16} /> COPIAR TODO</button>
          <button className="btn-green" onClick={onNotify}><Send size={16} /> ENVIAR A WHATSAPP</button>
        </div>
      </section>
    </div>
  );
}

function ProductModal({
  product,
  saving,
  onClose,
  onSave
}: {
  product?: ProductRow;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ProductDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductDraft>({
    name: product?.name || "",
    maxProfiles: product?.maxProfiles || 5,
    link: product?.link || "",
    imageUrl: product?.imageUrl || "",
    color: product?.color || "#e50914"
  });

  function patch<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Selecciona una imagen válida.");
      return;
    }
    try {
      patch("imageUrl", await resizeImage(file));
    } catch {
      window.alert("No pude procesar esa imagen. Prueba con JPG, PNG o WEBP.");
    }
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[155px]">
      <form
        className="modal-card relative max-h-[calc(100vh-180px)] w-[min(640px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-7 text-lg font-medium">{product ? "Editar cuenta" : "Nueva cuenta"}</h2>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[11px] text-[#ff174f]">Servicio *</span>
            <input className="input-line" value={draft.name} onChange={(event) => patch("name", event.target.value)} required />
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] text-[#ff174f]">Perfiles *</span>
            <input className="input-line" type="number" min={1} max={20} value={draft.maxProfiles} onChange={(event) => patch("maxProfiles", Number(event.target.value || 1))} required />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Link producto</span>
            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-[#9a9da4]" />
              <input className="input-line" value={draft.link} onChange={(event) => patch("link", event.target.value)} placeholder="https://... o netflix.com" />
            </div>
          </label>
          <label className="image-drop grid gap-2">
            <span className="flex items-center gap-2 text-[#d0d2d7]"><ImagePlus size={16} /> Subir imagen o logo del servicio</span>
            <input className="input-line file:mr-4 file:rounded-full file:border-0 file:bg-[#303640] file:px-3 file:py-1 file:text-white" type="file" accept="image/*" onChange={(event) => void uploadImage(event.target.files?.[0])} />
            <small className="text-[#9a9da4]">La imagen se optimiza automáticamente para que el guardado sea rápido y estable.</small>
          </label>
          <div className="preview-strip logo-preview-strip flex items-center gap-4 rounded-xl p-3">
            <ProductBadge name={draft.name || "Servicio"} color={draft.color} imageUrl={draft.imageUrl} />
            <div className="grid gap-1">
              <span className="text-[#d0d2d7]">Vista previa del logo</span>
              <small className="text-[#9a9da4]">Solo se mostrará el icono del servicio.</small>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ComboModal({
  combo,
  products,
  saving,
  onClose,
  onSave
}: {
  combo?: ComboRow;
  products: ProductRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ComboDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ComboDraft>({
    name: combo?.name || "",
    productIds: combo?.items.map((item) => item.productId) || [],
    saleCents: combo?.saleCents || 0,
    costCents: combo?.costCents || 0,
    notes: combo?.notes || ""
  });

  function patch<K extends keyof ComboDraft>(key: K, value: ComboDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleProduct(productId: string) {
    setDraft((current) => ({
      ...current,
      productIds: current.productIds.includes(productId)
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId]
    }));
  }

  const profit = draft.saleCents - draft.costCents;
  const margin = draft.saleCents ? Math.round((profit / draft.saleCents) * 100) : 0;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[105px]">
      <form
        className="modal-card relative max-h-[calc(100vh-130px)] w-[min(760px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-2 text-lg font-medium">{combo ? "Editar combo" : "Nuevo combo"}</h2>
        <p className="mb-6 text-sm text-[#9a9da4]">Crea paquetes de varias plataformas con costo, precio de venta y margen estimado.</p>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="field-label-required">Nombre del combo *</span>
            <input className="input-line" value={draft.name} onChange={(event) => patch("name", event.target.value)} placeholder="Netflix + Disney + Prime" required />
          </label>

          <section className="combo-product-picker">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="field-label-required">Servicios incluidos *</span>
              <small className="text-[#9a9da4]">{draft.productIds.length} seleccionados</small>
            </div>
            <div className="grid grid-cols-2 gap-2 max-md:grid-cols-1">
              {products.map((product) => {
                const selected = draft.productIds.includes(product.id);
                return (
                  <button
                    type="button"
                    key={product.id}
                    className={`combo-product-option ${selected ? "combo-product-option-active" : ""}`}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <ProductBadge name={product.name} color={product.color} imageUrl={product.imageUrl} />
                    <span>{product.name}</span>
                    {selected ? <CheckCircle2 size={17} /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <label className="grid gap-2">
              <span className="field-label-required">Precio venta al cliente *</span>
              <input className="input-line" type="number" min={0} value={draft.saleCents / 100} onChange={(event) => patch("saleCents", Math.round(Number(event.target.value || 0) * 100))} />
            </label>
            <label className="grid gap-2">
              <span className="field-label-required">Costo total proveedor *</span>
              <input className="input-line" type="number" min={0} value={draft.costCents / 100} onChange={(event) => patch("costCents", Math.round(Number(event.target.value || 0) * 100))} />
            </label>
          </div>

          <div className="combo-summary-card">
            <div><small>Venta</small><strong>{money(draft.saleCents)}</strong></div>
            <div><small>Costo</small><strong>{money(draft.costCents)}</strong></div>
            <div><small>Ganancia</small><strong className={profit >= 0 ? "text-[#00d267]" : "text-[#ff174f]"}>{money(profit)}</strong></div>
            <p>Margen estimado: {margin}% · Este dato alimentará los reportes y las ventas por combo.</p>
          </div>

          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Notas</span>
            <textarea className="input-line min-h-[90px]" value={draft.notes} onChange={(event) => patch("notes", event.target.value)} placeholder="Condiciones, duración, observaciones del paquete..." />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving || draft.productIds.length < 2}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function IndividualSaleModal({
  products,
  accounts,
  providers,
  clients,
  saving,
  onClose,
  onSave
}: {
  products: ProductRow[];
  accounts: AccountRow[];
  providers: ProviderRow[];
  clients: ClientRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: IndividualSaleDraft) => Promise<void>;
}) {
  const defaultDueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const firstProduct = products[0];
  const [draft, setDraft] = useState<IndividualSaleDraft>(() =>
    makeIndividualSaleDraft(firstProduct, accounts, providers, defaultDueDate)
  );
  const selectedProduct = products.find((product) => product.id === draft.productId) || null;
  const selectedClient = clients.find((client) => client.id === draft.clientId) || null;

  function patch<K extends keyof IndividualSaleDraft>(key: K, value: IndividualSaleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchClient<K extends keyof IndividualSaleDraft["client"]>(key: K, value: IndividualSaleDraft["client"][K]) {
    setDraft((current) => ({ ...current, client: { ...current.client, [key]: value } }));
  }

  function accountsForProduct(productId: string) {
    return accounts.filter((account) => account.product.id === productId && account.profiles.some((profile) => !profile.client));
  }

  function freeProfiles(accountId: string) {
    return accounts.find((account) => account.id === accountId)?.profiles.filter((profile) => !profile.client) || [];
  }

  function providerOptionsForProduct(productId: string) {
    return providers
      .map((provider) => {
        const offer = provider.offers.find((item) => item.productId === productId);
        return offer ? { provider, offer } : null;
      })
      .filter(Boolean) as Array<{ provider: ProviderRow; offer: ProviderRow["offers"][number] }>;
  }

  function changeProduct(productId: string) {
    const product = products.find((item) => item.id === productId);
    setDraft((current) => ({
      ...makeIndividualSaleDraft(product, accounts, providers, current.dueDate || defaultDueDate),
      clientId: current.clientId,
      client: current.client,
      soldCents: current.soldCents,
      notes: current.notes
    }));
  }

  function switchMode(mode: "EXISTING" | "CREATE") {
    if (!selectedProduct) return;
    const base = makeIndividualSaleDraft(selectedProduct, accounts, providers, draft.dueDate || defaultDueDate);
    setDraft((current) => ({
      ...base,
      mode,
      accountId: mode === "EXISTING" ? base.accountId : "",
      profileId: mode === "EXISTING" ? base.profileId : "",
      providerId: mode === "CREATE" ? base.providerId : current.providerId,
      purchaseCents: mode === "CREATE" ? base.purchaseCents : current.purchaseCents,
      clientId: current.clientId,
      client: current.client,
      email: mode === "CREATE" ? current.email : "",
      password: mode === "CREATE" ? current.password : "",
      profileName: current.profileName || base.profileName,
      pin: current.pin || base.pin,
      soldCents: current.soldCents,
      notes: current.notes
    }));
  }

  const productAccounts = accountsForProduct(draft.productId);
  const profileOptions = freeProfiles(draft.accountId);
  const providerOptions = providerOptionsForProduct(draft.productId);
  const selectedProvider = providerOptions.find((option) => option.provider.id === draft.providerId);
  const selectedAccount = accounts.find((account) => account.id === draft.accountId);
  const realCostCents = draft.mode === "CREATE"
    ? draft.purchaseCents
    : selectedAccount
      ? Math.round(selectedAccount.purchaseCents / Math.max(selectedAccount.profiles.length, 1))
      : 0;
  const profitCents = draft.soldCents - realCostCents;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start overflow-auto py-10">
      <form
        className="modal-card relative mx-auto w-[min(920px,calc(100vw-28px))] rounded-[24px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.productId) return window.alert("Selecciona un servicio.");
          if (!draft.clientId && !draft.client.name.trim()) return window.alert("Selecciona o crea un cliente.");
          if (draft.mode === "EXISTING" && (!draft.accountId || !draft.profileId)) return window.alert("Selecciona una cuenta y un perfil libre.");
          if (draft.mode === "CREATE" && (!draft.email.trim() || !draft.password.trim())) return window.alert("Escribe usuario/correo y contraseña de la cuenta nueva.");
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#19e6ff]">Venta asistida</p>
            <h2 className="text-2xl font-black">Venta individual</h2>
            <p className="mt-1 text-sm text-[#9a9da4]">Vende una plataforma, usando stock existente o creando la cuenta en esta misma pantalla.</p>
          </div>
          <div className="combo-summary-card min-w-[330px]">
            <div><small>Venta</small><strong>{money(draft.soldCents)}</strong></div>
            <div><small>Costo real</small><strong>{money(realCostCents)}</strong></div>
            <div><small>Ganancia</small><strong className={profitCents >= 0 ? "text-[#00d267]" : "text-[#ff174f]"}>{money(profitCents)}</strong></div>
            <p>Estos valores se registran en Finanzas al guardar.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <section className="premium-card col-span-4 grid gap-4 rounded-[20px] p-5 max-lg:col-span-12">
            <label className="grid gap-2">
              <span className="field-label-required">Servicio vendido *</span>
              <select className="input-line" value={draft.productId} onChange={(event) => changeProduct(event.target.value)} required>
                {!products.length ? <option value="">No hay servicios creados</option> : null}
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="field-label-required">Cliente *</span>
              <select className="input-line" value={draft.clientId} onChange={(event) => patch("clientId", event.target.value)}>
                <option value="">Crear cliente nuevo</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}{client.phone ? ` · ${client.phone}` : ""}</option>
                ))}
              </select>
            </label>

            {!draft.clientId ? (
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <input className="input-line" value={draft.client.name} onChange={(event) => patchClient("name", event.target.value)} placeholder="Nombre del cliente" />
                <input className="input-line" value={draft.client.phone} onChange={(event) => patchClient("phone", event.target.value)} placeholder="WhatsApp" />
                <input className="input-line" type="email" value={draft.client.email} onChange={(event) => patchClient("email", event.target.value)} placeholder="Correo opcional" />
              </div>
            ) : (
              <div className="rounded-2xl border border-[#00d267]/25 bg-[#00d267]/10 p-4 text-sm text-[#d9ffe9]">
                Cliente seleccionado: <b>{selectedClient?.name}</b>{selectedClient?.phone ? ` · ${selectedClient.phone}` : ""}
              </div>
            )}

            <label className="grid gap-2">
              <span className="field-label-required">Fecha de vencimiento *</span>
              <input className="input-line" type="date" value={draft.dueDate} onChange={(event) => patch("dueDate", event.target.value)} required />
            </label>

            <label className="grid gap-2">
              <span className="field-label-required">Precio cobrado *</span>
              <input className="input-line" type="number" min={0} step={1} value={draft.soldCents / 100} onChange={(event) => patch("soldCents", Math.round(Number(event.target.value || 0) * 100))} />
            </label>
          </section>

          <section className="premium-card col-span-8 grid gap-4 rounded-[20px] p-5 max-lg:col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedProduct ? <ProductBadge name={selectedProduct.name} color={selectedProduct.color} imageUrl={selectedProduct.imageUrl} /> : null}
                <div>
                  <b>{selectedProduct?.name || "Servicio"}</b>
                  <small className="block text-[#9a9da4]">
                    {productAccounts.length ? `${productAccounts.length} cuentas con perfiles libres` : "Sin stock libre: puedes crear la cuenta aquí"}
                  </small>
                </div>
              </div>
              <span className="profit-pill">Costo real perfil: {money(realCostCents)}</span>
            </div>

            <div className="combo-mode-toggle">
              <button type="button" className={draft.mode === "EXISTING" ? "combo-mode-active" : ""} onClick={() => switchMode("EXISTING")} disabled={!productAccounts.length}>
                Usar perfil libre
              </button>
              <button type="button" className={draft.mode === "CREATE" ? "combo-mode-active" : ""} onClick={() => switchMode("CREATE")}>
                Crear cuenta aquí
              </button>
            </div>

            <div className="grid grid-cols-12 gap-3">
              {draft.mode === "CREATE" ? (
                <>
                  <label className="col-span-6 grid gap-1 max-md:col-span-12">
                    <span className="text-xs text-[#9a9da4]">Proveedor de compra</span>
                    <select
                      className="input-line"
                      value={draft.providerId}
                      onChange={(event) => {
                        const option = providerOptions.find((row) => row.provider.id === event.target.value);
                        setDraft((current) => ({ ...current, providerId: event.target.value, purchaseCents: option?.offer.costCents ?? current.purchaseCents }));
                      }}
                    >
                      <option value="">Sin proveedor asignado</option>
                      {providerOptions.map(({ provider, offer }) => (
                        <option key={provider.id} value={provider.id}>{provider.name} · {money(offer.costCents)}</option>
                      ))}
                    </select>
                    {selectedProvider ? <small className="text-[#9a9da4]">Costo sugerido: {money(selectedProvider.offer.costCents)}</small> : null}
                  </label>
                  <label className="col-span-3 grid gap-1 max-md:col-span-6">
                    <span className="text-xs text-[#9a9da4]">Costo compra</span>
                    <input className="input-line" type="number" min={0} step={1} value={draft.purchaseCents / 100} onChange={(event) => patch("purchaseCents", Math.round(Number(event.target.value || 0) * 100))} />
                  </label>
                  <label className="col-span-8 grid gap-1 max-md:col-span-12">
                    <span className="field-label-required">Usuario/Correo cuenta *</span>
                    <input className="input-line" value={draft.email} onChange={(event) => patch("email", event.target.value)} placeholder="correo@proveedor.com" />
                  </label>
                  <label className="col-span-4 grid gap-1 max-md:col-span-12">
                    <span className="field-label-required">Contraseña cuenta *</span>
                    <input className="input-line" value={draft.password} onChange={(event) => patch("password", event.target.value)} />
                  </label>
                </>
              ) : (
                <>
                  <label className="col-span-7 grid gap-1 max-md:col-span-12">
                    <span className="text-xs text-[#9a9da4]">Cuenta madre</span>
                    <select
                      className="input-line"
                      value={draft.accountId}
                      onChange={(event) => {
                        const account = accounts.find((row) => row.id === event.target.value);
                        const profile = account?.profiles.find((row) => !row.client);
                        setDraft((current) => ({
                          ...current,
                          accountId: account?.id || "",
                          profileId: profile?.id || "",
                          profileName: profile?.name || current.profileName,
                          pin: profile?.pin || current.pin
                        }));
                      }}
                      required
                    >
                      <option value="">Selecciona cuenta</option>
                      {productAccounts.map((account) => (
                        <option key={account.id} value={account.id}>{account.email} · {account.profiles.filter((profile) => !profile.client).length} libres</option>
                      ))}
                    </select>
                  </label>
                  <label className="col-span-5 grid gap-1 max-md:col-span-12">
                    <span className="text-xs text-[#9a9da4]">Perfil libre</span>
                    <select
                      className="input-line"
                      value={draft.profileId}
                      onChange={(event) => {
                        const profile = profileOptions.find((row) => row.id === event.target.value);
                        setDraft((current) => ({
                          ...current,
                          profileId: profile?.id || "",
                          profileName: profile?.name || current.profileName,
                          pin: profile?.pin || current.pin
                        }));
                      }}
                      required
                    >
                      <option value="">Selecciona perfil</option>
                      {profileOptions.map((profile) => (
                        <option key={profile.id} value={profile.id}>{profile.name}{profile.pin ? ` · PIN ${profile.pin}` : ""}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label className="col-span-4 grid gap-1 max-md:col-span-6">
                <span className="text-xs text-[#9a9da4]">PIN</span>
                <input className="input-line" value={draft.pin} onChange={(event) => patch("pin", event.target.value)} />
              </label>
              <label className="col-span-8 grid gap-1 max-md:col-span-12">
                <span className="text-xs text-[#9a9da4]">Nombre perfil para entregar</span>
                <input className="input-line" value={draft.profileName} onChange={(event) => patch("profileName", event.target.value)} />
              </label>
              <label className="col-span-12 grid gap-1">
                <span className="text-xs text-[#9a9da4]">Observación</span>
                <textarea className="input-line min-h-16" value={draft.notes} onChange={(event) => patch("notes", event.target.value)} />
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="btn-green" disabled={saving || !selectedProduct}>{saving ? "Guardando..." : <><Save size={16} /> Guardar venta individual</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ComboSaleModal({
  combos,
  accounts,
  providers,
  clients,
  initialComboId,
  saving,
  onClose,
  onSave
}: {
  combos: ComboRow[];
  accounts: AccountRow[];
  providers: ProviderRow[];
  clients: ClientRow[];
  initialComboId?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ComboSaleDraft) => Promise<void>;
}) {
  const defaultDueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const firstCombo = combos.find((combo) => combo.id === initialComboId) || combos[0];
  const [differentDates, setDifferentDates] = useState(false);
  const [draft, setDraft] = useState<ComboSaleDraft>(() => buildComboSaleDraft(firstCombo, accounts, defaultDueDate));
  const selectedCombo = useMemo(() => combos.find((combo) => combo.id === draft.comboId) || null, [combos, draft.comboId]);
  const selectedClient = useMemo(() => clients.find((client) => client.id === draft.clientId) || null, [clients, draft.clientId]);

  function patch<K extends keyof ComboSaleDraft>(key: K, value: ComboSaleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchClient<K extends keyof ComboSaleDraft["client"]>(key: K, value: ComboSaleDraft["client"][K]) {
    setDraft((current) => ({ ...current, client: { ...current.client, [key]: value } }));
  }

  function patchItem(index: number, next: Partial<ComboSaleDraft["items"][number]>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item)
    }));
  }

  function costForSaleItem(item: ComboSaleDraft["items"][number]) {
    if (item.mode === "CREATE") return Math.max(item.purchaseCents || 0, 0);
    const account = accounts.find((row) => row.id === item.accountId);
    if (!account) return 0;
    return Math.round(account.purchaseCents / Math.max(account.profiles.length, 1));
  }

  function distributeSalesByRealCost(items: ComboSaleDraft["items"], totalSaleCents: number) {
    const allocations = allocateByWeights(
      items.map((item) => costForSaleItem(item)),
      totalSaleCents
    );
    return items.map((item, index) => ({ ...item, soldCents: allocations[index] ?? item.soldCents }));
  }

  function patchItemAndRecalculate(index: number, next: Partial<ComboSaleDraft["items"][number]>) {
    setDraft((current) => {
      const nextItems = current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...next } : item);
      return {
        ...current,
        items: distributeSalesByRealCost(nextItems, current.totalSaleCents)
      };
    });
  }

  function selectCombo(comboId: string) {
    const combo = combos.find((item) => item.id === comboId);
    setDraft((current) => {
      const nextDraft = {
        ...buildComboSaleDraft(combo, accounts, current.dueDate || defaultDueDate),
        clientId: current.clientId,
        client: current.client,
        notes: current.notes,
        totalSaleCents: combo?.saleCents || current.totalSaleCents
      };
      return {
        ...nextDraft,
        items: distributeSalesByRealCost(nextDraft.items, nextDraft.totalSaleCents)
      };
    });
  }

  function changeTotalSale(value: number) {
    setDraft((current) => {
      return {
        ...current,
        totalSaleCents: value,
        items: distributeSalesByRealCost(current.items, value)
      };
    });
  }

  function changeDueDate(value: string) {
    setDraft((current) => ({
      ...current,
      dueDate: value,
      items: differentDates ? current.items : current.items.map((item) => ({ ...item, dueDate: value }))
    }));
  }

  function accountsForProduct(productId: string) {
    return accounts.filter((account) => account.product.id === productId && account.profiles.some((profile) => !profile.client));
  }

  function freeProfiles(accountId: string) {
    return accounts.find((account) => account.id === accountId)?.profiles.filter((profile) => !profile.client) || [];
  }

  function providerOptionsForProduct(productId: string) {
    return providers
      .map((provider) => {
        const offer = provider.offers.find((item) => item.productId === productId);
        return offer ? { provider, offer } : null;
      })
      .filter(Boolean) as Array<{ provider: ProviderRow; offer: ProviderRow["offers"][number] }>;
  }

  function switchItemToExisting(index: number, productId: string) {
    const account = accountsForProduct(productId)[0];
    const profile = account?.profiles.find((row) => !row.client);
    patchItemAndRecalculate(index, {
      mode: "EXISTING",
      accountId: account?.id || "",
      profileId: profile?.id || "",
      profileName: profile?.name || `Perfil ${index + 1}`,
      pin: profile?.pin || ""
    });
  }

  function switchItemToCreate(index: number, productId: string) {
    const providerOption = providerOptionsForProduct(productId)[0];
    patchItemAndRecalculate(index, {
      mode: "CREATE",
      accountId: "",
      profileId: "",
      providerId: providerOption?.provider.id || "",
      purchaseCents: providerOption?.offer.costCents ?? draft.items[index]?.purchaseCents ?? 0,
      email: "",
      password: "",
      profileName: draft.items[index]?.profileName || `Perfil ${index + 1}`,
      pin: draft.items[index]?.pin || `${2500 + index + 1}`
    });
  }

  const realCostCents = draft.items.reduce((sum, item) => {
    if (item.mode === "CREATE") return sum + item.purchaseCents;
    const account = accounts.find((row) => row.id === item.accountId);
    if (!account) return sum;
    const profileCount = Math.max(account.profiles.length, 1);
    return sum + Math.round(account.purchaseCents / profileCount);
  }, 0);
  const referenceCostCents = selectedCombo?.costCents || realCostCents;
  const profitCents = draft.totalSaleCents - realCostCents;

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start overflow-auto py-10">
      <form
        className="modal-card relative mx-auto w-[min(1080px,calc(100vw-28px))] rounded-[24px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.comboId) {
            window.alert("Crea o selecciona un combo primero.");
            return;
          }
          if (!draft.clientId && !draft.client.name.trim()) {
            window.alert("Selecciona un cliente existente o escribe el nombre del nuevo cliente.");
            return;
          }
          const missing = draft.items.find((item) => item.mode === "EXISTING" ? (!item.accountId || !item.profileId) : (!item.email.trim() || !item.password.trim()));
          if (missing) {
            window.alert("Cada plataforma del combo debe tener un perfil libre seleccionado o los datos de la cuenta nueva completos.");
            return;
          }
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#19e6ff]">Venta asistida</p>
            <h2 className="text-2xl font-black">Nuevo combo</h2>
            <p className="mt-1 text-sm text-[#9a9da4]">Vende varias plataformas en una sola pantalla y registra automáticamente cliente, perfiles e ingreso.</p>
          </div>
          <div className="combo-summary-card min-w-[330px]">
            <div><small>Venta total</small><strong>{money(draft.totalSaleCents)}</strong></div>
            <div><small>Costo real</small><strong>{money(realCostCents)}</strong></div>
            <div><small>Ganancia</small><strong className={profitCents >= 0 ? "text-[#00d267]" : "text-[#ff174f]"}>{money(profitCents)}</strong></div>
            <p>Costo de catálogo: {money(referenceCostCents)} · Puedes editar cada valor asignado.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <section className="premium-card col-span-4 grid gap-4 rounded-[20px] p-5 max-lg:col-span-12">
            <label className="grid gap-2">
              <span className="field-label-required">Combo vendido *</span>
              <select className="input-line" value={draft.comboId} onChange={(event) => selectCombo(event.target.value)} required>
                {!combos.length ? <option value="">No hay combos creados</option> : null}
                {combos.map((combo) => (
                  <option key={combo.id} value={combo.id}>{combo.name} · {money(combo.saleCents)}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="field-label-required">Cliente *</span>
              <select className="input-line" value={draft.clientId} onChange={(event) => patch("clientId", event.target.value)}>
                <option value="">Crear cliente nuevo</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}{client.phone ? ` · ${client.phone}` : ""}</option>
                ))}
              </select>
            </label>

            {!draft.clientId ? (
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <input className="input-line" value={draft.client.name} onChange={(event) => patchClient("name", event.target.value)} placeholder="Nombre del cliente" />
                <input className="input-line" value={draft.client.phone} onChange={(event) => patchClient("phone", event.target.value)} placeholder="WhatsApp" />
                <input className="input-line" type="email" value={draft.client.email} onChange={(event) => patchClient("email", event.target.value)} placeholder="Correo opcional" />
              </div>
            ) : (
              <div className="rounded-2xl border border-[#00d267]/25 bg-[#00d267]/10 p-4 text-sm text-[#d9ffe9]">
                Cliente seleccionado: <b>{selectedClient?.name}</b>{selectedClient?.phone ? ` · ${selectedClient.phone}` : ""}
              </div>
            )}

            <label className="grid gap-2">
              <span className="field-label-required">Fecha de vencimiento general *</span>
              <input className="input-line" type="date" value={draft.dueDate} onChange={(event) => changeDueDate(event.target.value)} required />
            </label>

            <label className="grid gap-2">
              <span className="field-label-required">Precio total cobrado *</span>
              <input className="input-line" type="number" min={0} step={1} value={draft.totalSaleCents / 100} onChange={(event) => changeTotalSale(Math.round(Number(event.target.value || 0) * 100))} />
            </label>

            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-[#d0d2d7]"
              onClick={() => setDifferentDates((value) => !value)}
            >
              {differentDates ? <ToggleRight className="text-[#00d267]" /> : <ToggleLeft className="text-[#9a9da4]" />}
              Fechas diferentes por plataforma
            </button>
          </section>

          <section className="col-span-8 grid gap-3 max-lg:col-span-12">
            {selectedCombo?.items.map((comboItem, index) => {
              const item = draft.items[index];
              const productAccounts = accountsForProduct(comboItem.productId);
              const profileOptions = freeProfiles(item?.accountId || "");
              const selectedAccount = accounts.find((account) => account.id === item?.accountId);
              const providerOptions = providerOptionsForProduct(comboItem.productId);
              const selectedProvider = providerOptions.find((option) => option.provider.id === item?.providerId);
              const productCost = item?.mode === "CREATE"
                ? item.purchaseCents
                : selectedAccount
                  ? Math.round(selectedAccount.purchaseCents / Math.max(selectedAccount.profiles.length, 1))
                  : 0;

              return (
                <article key={comboItem.id} className="premium-card grid gap-4 rounded-[20px] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ProductBadge name={comboItem.product.name} color={comboItem.product.color} imageUrl={comboItem.product.imageUrl} />
                      <div>
                        <b>{comboItem.product.name}</b>
                        <small className="block text-[#9a9da4]">
                          {item?.mode === "CREATE"
                            ? "Creando cuenta nueva dentro de esta venta"
                            : productAccounts.length
                              ? `${productAccounts.length} cuentas con perfiles libres`
                              : "Sin stock libre: puedes crear la cuenta aquí"}
                        </small>
                      </div>
                    </div>
                    <span className="profit-pill">Costo real perfil: {money(productCost)}</span>
                  </div>

                  <div className="combo-mode-toggle">
                    <button
                      type="button"
                      className={item?.mode === "EXISTING" ? "combo-mode-active" : ""}
                      onClick={() => switchItemToExisting(index, comboItem.productId)}
                      disabled={!productAccounts.length}
                    >
                      Usar perfil libre
                    </button>
                    <button
                      type="button"
                      className={item?.mode === "CREATE" ? "combo-mode-active" : ""}
                      onClick={() => switchItemToCreate(index, comboItem.productId)}
                    >
                      Crear cuenta aquí
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {item?.mode === "CREATE" ? (
                      <>
                        <label className="col-span-5 grid gap-1 max-md:col-span-12">
                          <span className="text-xs text-[#9a9da4]">Proveedor de compra</span>
                          <select
                            className="input-line"
                            value={item?.providerId || ""}
                            onChange={(event) => {
                              const option = providerOptions.find((row) => row.provider.id === event.target.value);
                              patchItemAndRecalculate(index, {
                                providerId: event.target.value,
                                purchaseCents: option?.offer.costCents ?? item.purchaseCents
                              });
                            }}
                          >
                            <option value="">Sin proveedor asignado</option>
                            {providerOptions.map(({ provider, offer }) => (
                              <option key={provider.id} value={provider.id}>{provider.name} · {money(offer.costCents)}</option>
                            ))}
                          </select>
                          {selectedProvider ? <small className="text-[#9a9da4]">Costo sugerido del proveedor: {money(selectedProvider.offer.costCents)}</small> : null}
                        </label>
                        <label className="col-span-3 grid gap-1 max-md:col-span-12">
                          <span className="text-xs text-[#9a9da4]">Costo compra</span>
                          <input className="input-line" type="number" min={0} step={1} value={(item?.purchaseCents || 0) / 100} onChange={(event) => patchItemAndRecalculate(index, { purchaseCents: Math.round(Number(event.target.value || 0) * 100) })} />
                        </label>
                        <label className="col-span-6 grid gap-1 max-md:col-span-12">
                          <span className="field-label-required">Usuario/Correo cuenta *</span>
                          <input className="input-line" value={item?.email || ""} onChange={(event) => patchItem(index, { email: event.target.value })} placeholder={`${comboItem.product.name.toLowerCase()}@proveedor.com`} />
                        </label>
                        <label className="col-span-4 grid gap-1 max-md:col-span-12">
                          <span className="field-label-required">Contraseña cuenta *</span>
                          <input className="input-line" value={item?.password || ""} onChange={(event) => patchItem(index, { password: event.target.value })} />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="col-span-5 grid gap-1 max-md:col-span-12">
                          <span className="text-xs text-[#9a9da4]">Cuenta madre</span>
                          <select
                            className="input-line"
                            value={item?.accountId || ""}
                            onChange={(event) => {
                              const account = accounts.find((row) => row.id === event.target.value);
                              const profile = account?.profiles.find((row) => !row.client);
                              patchItemAndRecalculate(index, {
                                mode: "EXISTING",
                                accountId: account?.id || "",
                                profileId: profile?.id || "",
                                profileName: profile?.name || `Perfil ${index + 1}`,
                                pin: profile?.pin || ""
                              });
                            }}
                            required
                          >
                            <option value="">Selecciona cuenta</option>
                            {productAccounts.map((account) => (
                              <option key={account.id} value={account.id}>{account.email} · {account.profiles.filter((profile) => !profile.client).length} libres</option>
                            ))}
                          </select>
                        </label>

                        <label className="col-span-3 grid gap-1 max-md:col-span-12">
                          <span className="text-xs text-[#9a9da4]">Perfil libre</span>
                          <select
                            className="input-line"
                            value={item?.profileId || ""}
                            onChange={(event) => {
                              const profile = profileOptions.find((row) => row.id === event.target.value);
                              patchItem(index, {
                                mode: "EXISTING",
                                profileId: profile?.id || "",
                                profileName: profile?.name || item?.profileName || "",
                                pin: profile?.pin || item?.pin || ""
                              });
                            }}
                            required
                          >
                            <option value="">Selecciona perfil</option>
                            {profileOptions.map((profile) => (
                              <option key={profile.id} value={profile.id}>{profile.name}{profile.pin ? ` · PIN ${profile.pin}` : ""}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}

                    <label className="col-span-2 grid gap-1 max-md:col-span-6">
                      <span className="text-xs text-[#9a9da4]">PIN</span>
                      <input className="input-line" value={item?.pin || ""} onChange={(event) => patchItem(index, { pin: event.target.value })} />
                    </label>

                    <label className="col-span-2 grid gap-1 max-md:col-span-6">
                      <span className="text-xs text-[#9a9da4]">Venta asignada</span>
                      <input className="input-line" type="number" min={0} step={1} value={(item?.soldCents || 0) / 100} onChange={(event) => patchItem(index, { soldCents: Math.round(Number(event.target.value || 0) * 100) })} />
                    </label>

                    <label className="col-span-6 grid gap-1 max-md:col-span-12">
                      <span className="text-xs text-[#9a9da4]">Nombre perfil para entregar</span>
                      <input className="input-line" value={item?.profileName || ""} onChange={(event) => patchItem(index, { profileName: event.target.value })} />
                    </label>

                    {differentDates ? (
                      <label className="col-span-6 grid gap-1 max-md:col-span-12">
                        <span className="text-xs text-[#9a9da4]">Vence este servicio</span>
                        <input className="input-line" type="date" value={item?.dueDate || draft.dueDate} onChange={(event) => patchItem(index, { dueDate: event.target.value })} />
                      </label>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!selectedCombo ? (
              <div className="premium-card rounded-[20px] p-6 text-[#9a9da4]">Primero crea un combo en el catálogo para poder venderlo.</div>
            ) : null}
          </section>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="btn-green" disabled={saving || !selectedCombo}>{saving ? "Guardando..." : <><Save size={16} /> Guardar venta combo</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function MovementModal({
  movement,
  saving,
  onClose,
  onSave
}: {
  movement?: MovementRow;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: MovementDraft) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<MovementDraft>({
    type: movement?.type || "INCOME",
    concept: movement?.concept || "",
    amountCents: movement?.amountCents || 0,
    date: movement ? dateInput(movement.date) : today
  });

  function patch<K extends keyof MovementDraft>(key: K, value: MovementDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-center">
      <form
        className="modal-card relative w-[min(560px,calc(100vw-28px))] rounded-[22px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#19e6ff]">Finanzas</p>
        <h2 className="mb-6 text-2xl font-black">{movement ? "Editar movimiento" : "Nuevo movimiento"}</h2>
        <div className="grid gap-5">
          <div className="combo-mode-toggle">
            <button type="button" className={draft.type === "INCOME" ? "combo-mode-active" : ""} onClick={() => patch("type", "INCOME")}>Venta / ingreso</button>
            <button type="button" className={draft.type === "EXPENSE" ? "combo-mode-active" : ""} onClick={() => patch("type", "EXPENSE")}>Gasto / compra</button>
          </div>
          <label className="grid gap-2">
            <span className="field-label-required">Detalle *</span>
            <input className="input-line" value={draft.concept} onChange={(event) => patch("concept", event.target.value)} placeholder="Ej: Venta combo Netflix + Disney - Cliente Willy" required />
          </label>
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <label className="grid gap-2">
              <span className="field-label-required">Monto *</span>
              <input className="input-line" type="number" min={0} value={draft.amountCents / 100} onChange={(event) => patch("amountCents", Math.round(Number(event.target.value || 0) * 100))} required />
            </label>
            <label className="grid gap-2">
              <span className="field-label-required">Fecha *</span>
              <input className="input-line" type="date" value={draft.date} onChange={(event) => patch("date", event.target.value)} required />
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ClientModal({
  client,
  saving,
  onClose,
  onSave
}: {
  client?: ClientRow;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ClientDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ClientDraft>({
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    notes: client?.notes || "",
    status: client?.status || "INACTIVE"
  });

  function patch<K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[155px]">
      <form
        className="modal-card relative max-h-[calc(100vh-180px)] w-[min(600px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft);
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-7 text-lg font-medium">{client ? "Editar usuario" : "Nuevo usuario"}</h2>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Nombre</span>
            <input className="input-line" value={draft.name} onChange={(event) => patch("name", event.target.value)} required />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Celular</span>
            <input className="input-line" value={draft.phone} onChange={(event) => patch("phone", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Usuario/Correo</span>
            <input className="input-line" type="email" value={draft.email} onChange={(event) => patch("email", event.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Observación</span>
            <textarea className="input-line min-h-20" value={draft.notes} onChange={(event) => patch("notes", event.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ProviderModal({
  provider,
  products,
  saving,
  onClose,
  onSave
}: {
  provider?: ProviderRow;
  products: ProductRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: ProviderDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProviderDraft>({
    name: provider?.name || "",
    contact: provider?.contact || "",
    supportPhone: provider?.supportPhone || "",
    paymentPhone: provider?.paymentPhone || "",
    notes: provider?.notes || "",
    offers: provider?.offers.map((offer) => ({
      productId: offer.productId,
      costCents: offer.costCents
    })) || [{ productId: products[0]?.id || "", costCents: products[0]?.costCents || 0 }]
  });

  function patch<K extends keyof ProviderDraft>(key: K, value: ProviderDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchOffer(index: number, value: Partial<ProviderDraft["offers"][number]>) {
    setDraft((current) => ({
      ...current,
      offers: current.offers.map((offer, offerIndex) => (offerIndex === index ? { ...offer, ...value } : offer))
    }));
  }

  function addOffer() {
    setDraft((current) => ({
      ...current,
      offers: [...current.offers, { productId: products[0]?.id || "", costCents: products[0]?.costCents || 0 }]
    }));
  }

  function removeOffer(index: number) {
    setDraft((current) => ({
      ...current,
      offers: current.offers.filter((_, offerIndex) => offerIndex !== index)
    }));
  }

  const [offerQuery, setOfferQuery] = useState("");
  const offeredProductIds = new Set(draft.offers.map((offer) => offer.productId).filter(Boolean));
  const missingProducts = products.filter((product) => !offeredProductIds.has(product.id));
  const visibleOffers = draft.offers
    .map((offer, index) => ({ offer, index, product: products.find((item) => item.id === offer.productId) }))
    .filter(({ product }) => !offerQuery.trim() || product?.name.toLowerCase().includes(offerQuery.trim().toLowerCase()));

  function addAllMissingOffers() {
    setDraft((current) => {
      const currentIds = new Set(current.offers.map((offer) => offer.productId).filter(Boolean));
      const nextOffers = products
        .filter((product) => !currentIds.has(product.id))
        .map((product) => ({ productId: product.id, costCents: product.costCents || 0 }));

      return {
        ...current,
        offers: [...current.offers.filter((offer) => offer.productId), ...nextOffers]
      };
    });
  }

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[120px]">
      <form
        className="modal-card provider-modal relative max-h-[calc(100vh-145px)] w-[min(760px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            ...draft,
            offers: draft.offers.filter((offer) => offer.productId)
          });
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-7 text-lg font-medium">{provider ? "Editar proveedor" : "Nuevo proveedor"}</h2>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[11px] text-[#ff174f]">Nombre proveedor *</span>
            <input className="input-line" value={draft.name} onChange={(event) => patch("name", event.target.value)} placeholder="Ej: Mayorista Streaming Colombia" required />
          </label>
          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Contacto</span>
            <input className="input-line" value={draft.contact} onChange={(event) => patch("contact", event.target.value)} placeholder="WhatsApp, teléfono, correo o enlace" />
          </label>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <label className="grid gap-2">
              <span className="text-[#d0d2d7]">WhatsApp soporte</span>
              <input className="input-line" inputMode="tel" value={draft.supportPhone} onChange={(event) => patch("supportPhone", event.target.value)} placeholder="+57 300 000 0000" />
            </label>
            <label className="grid gap-2">
              <span className="text-[#d0d2d7]">WhatsApp pagos / recargas</span>
              <input className="input-line" inputMode="tel" value={draft.paymentPhone} onChange={(event) => patch("paymentPhone", event.target.value)} placeholder="+57 300 000 0000" />
            </label>
          </div>

          <section className="provider-offers-card grid gap-3 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 max-md:grid">
              <div>
                <h3 className="font-bold">Servicios que ofrece</h3>
                <p className="text-xs text-[#aeb3bd]">
                  Catálogo de precios por proveedor. Ideal para manejar 30+ productos sin saturar la pantalla.
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" className="btn-outline-blue" onClick={addOffer}><Plus size={15} /> Agregar servicio</button>
                <button type="button" className="btn-outline-green" onClick={addAllMissingOffers} disabled={!missingProducts.length}>
                  <PackagePlus size={15} /> Agregar catálogo completo
                </button>
              </div>
            </div>

            <div className="provider-offer-tools">
              <label className="provider-offer-search">
                <Search size={15} />
                <input value={offerQuery} onChange={(event) => setOfferQuery(event.target.value)} placeholder="Buscar servicio del proveedor..." />
              </label>
              <span>{draft.offers.filter((offer) => offer.productId).length} servicios asignados · {missingProducts.length} sin precio</span>
            </div>

            {visibleOffers.map(({ offer, index, product }) => {
              return (
                <div key={index} className="provider-offer-row grid grid-cols-[1fr_170px_42px] items-end gap-3 max-md:grid-cols-1">
                  <label className="grid gap-2">
                    <span className="text-[11px] text-[#d0d2d7]">Servicio</span>
                    <select
                      className="input-line"
                      value={offer.productId}
                      onChange={(event) => {
                        const nextProduct = products.find((item) => item.id === event.target.value);
                        patchOffer(index, { productId: event.target.value, costCents: nextProduct?.costCents || offer.costCents });
                      }}
                    >
                      {products.map((item) => (
                        <option value={item.id} key={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[11px] text-[#d0d2d7]">Valor compra</span>
                    <input className="input-line" type="number" min={0} value={offer.costCents / 100} onChange={(event) => patchOffer(index, { costCents: Math.round(Number(event.target.value || 0) * 100) })} />
                  </label>
                  <button type="button" className="icon-action text-[#ff174f]" title="Quitar servicio" onClick={() => removeOffer(index)}><Trash2 size={17} /></button>
                  {product ? (
                    <div className="col-span-full flex items-center gap-2 text-xs text-[#aeb3bd]">
                      <ProductBadge name={product.name} color={product.color} imageUrl={product.imageUrl} />
                      Este proveedor vende {product.name} a <strong className="text-white">{money(offer.costCents)}</strong>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Observación</span>
            <textarea className="input-line min-h-20" value={draft.notes} onChange={(event) => patch("notes", event.target.value)} placeholder="Notas internas: calidad, tiempos de respuesta, stock, garantía..." />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ProvidersTable({
  providers,
  onEdit,
  onDelete
}: {
  providers: ProviderRow[];
  onEdit: (provider: ProviderRow) => void;
  onDelete: (provider: ProviderRow) => void;
}) {
  return (
    <table className="data-table">
      <thead><tr><th>#</th><th>Proveedor</th><th>Servicios / costos</th><th>Contacto</th><th>Acciones</th></tr></thead>
      <tbody>
        {providers.map((provider, index) => (
          <tr key={provider.id}>
            <td>{index + 1}</td>
            <td>
              <div className="grid gap-1">
                <strong>{provider.name}</strong>
                {provider.notes ? <small className="text-[#9a9da4]">{provider.notes}</small> : null}
              </div>
            </td>
            <td>
              <div className="provider-offer-chips">
                {provider.offers.length ? provider.offers.slice(0, 5).map((offer) => (
                  <span key={offer.id} className="provider-offer-chip">
                    <ProductBadge name={offer.product.name} color={offer.product.color} imageUrl={offer.product.imageUrl} />
                    {offer.product.name}
                    <strong>{money(offer.costCents)}</strong>
                  </span>
                )) : <span className="text-[#9a9da4]">Sin servicios asignados</span>}
                {provider.offers.length > 5 ? (
                  <button type="button" className="provider-offer-more" onClick={() => onEdit(provider)} title="Ver catálogo completo">
                    +{provider.offers.length - 5} más · Ver catálogo
                  </button>
                ) : null}
              </div>
            </td>
            <td>
              <ProviderContactLinks provider={provider} />
            </td>
            <td>
              <div className="flex gap-2">
                <button className="icon-action text-[#cfd2d8]" title="Editar" onClick={() => onEdit(provider)}><Edit3 size={17} /></button>
                <button className="icon-action text-[#ff174f]" title="Eliminar" onClick={() => onDelete(provider)}><Trash2 size={17} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProviderContactLinks({ provider }: { provider: ProviderRow }) {
  const supportUrl = whatsappUrl(provider.supportPhone, `Hola ${provider.name}, necesito soporte.`);
  const paymentUrl = whatsappUrl(provider.paymentPhone, `Hola ${provider.name}, quiero realizar una recarga o pago.`);

  if (!supportUrl && !paymentUrl && !provider.contact) {
    return <span className="text-[#9a9da4]">-</span>;
  }

  return (
    <div className="provider-contact-links">
      {supportUrl ? (
        <a className="provider-wa-link support" href={supportUrl} target="_blank" rel="noreferrer" title="Abrir WhatsApp de soporte">
          <MessageCircle size={15} /> Soporte
          <small>{provider.supportPhone}</small>
        </a>
      ) : null}
      {paymentUrl ? (
        <a className="provider-wa-link payment" href={paymentUrl} target="_blank" rel="noreferrer" title="Abrir WhatsApp de pagos">
          <CreditCard size={15} /> Pagos
          <small>{provider.paymentPhone}</small>
        </a>
      ) : null}
      {provider.contact ? <small className="provider-contact-note">{provider.contact}</small> : null}
    </div>
  );
}

function ProductsTable({
  products,
  accounts,
  onReminder,
  onDelivery,
  onAccounts,
  onEdit,
  onDelete
}: {
  products: ProductRow[];
  accounts: AccountRow[];
  onReminder: (product: ProductRow) => void;
  onDelivery: (product: ProductRow) => void;
  onAccounts: (product: ProductRow) => void;
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
}) {
  return (
    <table className="data-table">
      <thead><tr><th>#</th><th>Servicio</th><th>Link producto</th><th>Precio</th><th>Max Perfiles</th><th># Cuentas</th><th>Acciones</th></tr></thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.id}>
            <td>{index + 1}</td>
            <td><ProductBadge name={product.name} color={product.color} imageUrl={product.imageUrl} />{product.name}</td>
            <td>{product.link || "-"}</td>
            <td>{product.priceCents ? money(product.priceCents) : "-"}</td>
            <td>{product.maxProfiles}</td>
            <td>{accounts.filter((account) => account.product.id === product.id).length}</td>
            <td>
              <div className="flex gap-2">
                <button className="icon-action text-[#03a9f4]" title="Plantilla notificación" onClick={() => onReminder(product)}><Bell size={17} /></button>
                <button className="icon-action text-[#00d267]" title="Plantilla envío de datos" onClick={() => onDelivery(product)}><UserRoundCheck size={17} /></button>
                <button className="icon-action text-[#ffb300]" title="Ver cuentas del servicio" onClick={() => onAccounts(product)}><Eye size={17} /></button>
                <button className="icon-action text-[#cfd2d8]" title="Editar" onClick={() => onEdit(product)}><Edit3 size={17} /></button>
                <button className="icon-action text-[#ff174f]" title="Eliminar" onClick={() => onDelete(product)}><Trash2 size={17} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ClientsTable({
  clients,
  selectedIds,
  setSelectedIds,
  startIndex,
  onWhatsApp,
  onDetail,
  onEdit,
  onDelete
}: {
  clients: ClientRow[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  startIndex: number;
  onWhatsApp: (client: ClientRow) => void;
  onDetail: (client: ClientRow) => void;
  onEdit: (client: ClientRow) => void;
  onDelete: (client: ClientRow) => void;
}) {
  const visibleIds = clients.map((client) => client.id);
  const selectedVisible = visibleIds.filter((id) => selectedIds.includes(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  function toggleClient(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>
            <label className="row-check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Seleccionar clientes visibles" />
              <span />
            </label>
          </th>
          <th>#</th><th>Nombre</th><th>Celular</th><th>Correo</th><th>Observación</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client, index) => (
          <tr key={client.id} className={selectedIds.includes(client.id) ? "row-selected" : ""}>
            <td>
              <label className="row-check">
                <input type="checkbox" checked={selectedIds.includes(client.id)} onChange={() => toggleClient(client.id)} aria-label={`Seleccionar ${client.name}`} />
                <span />
              </label>
            </td>
            <td>{startIndex + index + 1}</td>
            <td>{client.name}</td>
            <td>{client.phone}</td>
            <td>{client.email}</td>
            <td>{client.notes}</td>
            <td><span className={`pill ${client.status === "ACTIVE" ? "bg-[#00d267]" : "bg-[#ff174f]"}`}>{client.status === "ACTIVE" ? "Activo" : "Inactivo"}</span></td>
            <td>
              <div className="flex gap-2">
                <button className="icon-action text-[#00d267]" title="WhatsApp" onClick={() => onWhatsApp(client)}><MessageCircle size={17} /></button>
                <button className="icon-action text-[#ffb300]" title="Ver detalle" onClick={() => onDetail(client)}><Eye size={17} /></button>
                <button className="icon-action text-[#cfd2d8]" title="Editar" onClick={() => onEdit(client)}><Edit3 size={17} /></button>
                <button className="icon-action text-[#ff174f]" title="Eliminar" onClick={() => onDelete(client)}><Trash2 size={17} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TemplateModal({
  product,
  mode,
  library,
  onClose,
  onCopy,
  onSave
}: {
  product: ProductRow;
  mode: TemplateMode;
  library: TemplateLibrary;
  onClose: () => void;
  onCopy: (text: string) => void;
  onSave: (slot: number, text: string, conditions: string) => void;
}) {
  const defaults = mode === "reminder" ? DEFAULT_REMINDER_TEMPLATES : DEFAULT_DELIVERY_TEMPLATES;
  const slots = mergeTemplateSlots(library[mode], defaults);
  const [slot, setSlot] = useState(0);
  const [texts, setTexts] = useState(() => slots);
  const [conditionsText, setConditionsText] = useState(() => library.conditions || DEFAULT_USAGE_CONDITIONS);
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const text = texts[slot] || "";
  const slotLabels = TEMPLATE_SLOT_LABELS[mode];
  const isComboTemplate = slot === 1;

  function insertToken(token: string) {
    setTexts((current) => current.map((item, index) => (
      index === slot ? `${item}${item.endsWith(" ") || item.endsWith("\n") ? "" : " "}${token}` : item
    )));
  }

  function patchText(value: string) {
    setTexts((current) => current.map((item, index) => (index === slot ? value : item)));
  }

  const preview = renderTemplate(text, {
    service: product.name,
    client: "Cliente Demo",
    email: "cliente@email.com",
    password: "clave123",
    profile: "Perfil 1",
    pin: "1234",
    dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("es-CO"),
    paymentAccount: "NEQUI / Bancolombia",
    comboServices: `• *DISNEY+*\n  Correo: disney@email.com\n  Clave: clave123\n  Perfil: Perfil 1 · PIN: 1234 · Vence: ${new Date(Date.now() + 30 * 86400000).toLocaleDateString("es-CO")}\n\n• *NETFLIX*\n  Correo: netflix@email.com\n  Clave: clave456\n  Perfil: Perfil 2 · PIN: 2501 · Vence: ${new Date(Date.now() + 30 * 86400000).toLocaleDateString("es-CO")}`,
    conditions: conditionsText
  });
  const tokenButtons = [
    ["Nombre Servicio", "{{nombre_servicio}}"],
    ["Correo", "{{correo}}"],
    ["Contraseña", "{{contraseña}}"],
    ["Perfil", "{{perfil}}"],
    ["Pin", "{{pin}}"],
    ["Fec. Vto.", "{{fecha_vencimiento}}"],
    ["Condiciones", "{{condiciones_uso}}"],
    ...(isComboTemplate ? [["Servicios combo", "{{servicios_combo}}"]] : [])
  ];

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-center p-4">
      <section className="modal-card template-modal-card relative flex max-h-[calc(100vh-32px)] w-[min(900px,calc(100vw-24px))] flex-col overflow-hidden rounded-[18px] shadow-2xl">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="template-modal-body flex-1 overflow-y-auto p-5 pr-6">
          <div className="mb-4 pr-10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--island-cyan)]">
              Configuración global
            </p>
            <h2 className="mt-1 text-xl font-black">
              {mode === "reminder" ? "Plantillas de notificación" : "Plantillas de envío de datos"}
            </h2>
            <p className="mt-1 text-sm text-[#aab3c2]">
              1 servicio usa cuenta individual; varios servicios usan combo. Las condiciones se editan una sola vez y se insertan con {"{{condiciones_uso}}"}.
            </p>
          </div>
          <div className="template-slot-tabs mb-4">
            {[0, 1].map((item) => (
              <button
                key={item}
                type="button"
                className={slot === item ? "active" : ""}
                onClick={() => {
                  setSlot(item);
                  setPreviewMode(false);
                }}
              >
                {slotLabels[item]}
                <small>{item === 0 ? "Para ventas de un solo servicio" : "Para ventas de varios servicios"}</small>
              </button>
            ))}
          </div>
          <div className="mb-4 rounded-lg border border-[#03a9f4]/20 bg-[#071a20] p-3 text-sm text-[#9ee8ff]">
            No modificar el texto que se encuentre dentro de las {"{{llaves}}"}.
          </div>
          <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-dashed border-white/15 p-3">
            {tokenButtons.map(([label, token], index) => (
              <button
                key={token}
                type="button"
                className={index === 1 ? "btn-green" : index === 2 ? "btn-blue" : index === 3 ? "btn-pink" : "credit-chip"}
                onClick={() => insertToken(token)}
              >
                {label}
              </button>
            ))}
          </div>
          <section className="template-editor-box">
            <div className="template-editor-head">
              <strong>{previewMode ? "Vista final para el cliente" : "Mensaje con llaves"}</strong>
              <span>{previewMode ? "Variables reemplazadas" : "Edita aquí la plantilla global"}</span>
            </div>
            {previewMode ? (
              <pre className="template-message-preview whitespace-pre-wrap text-sm leading-relaxed">{preview}</pre>
            ) : (
              <textarea
                ref={textareaRef}
                className="input-line template-message-editor leading-relaxed"
                value={text}
                onChange={(event) => patchText(event.target.value)}
              />
            )}
          </section>
          <section className="template-editor-box mt-4">
            <div className="template-editor-head">
              <strong>Condiciones de uso globales</strong>
              <span>Se insertan con {"{{condiciones_uso}}"}</span>
            </div>
            <textarea
              className="input-line template-conditions-editor leading-relaxed"
              value={conditionsText}
              onChange={(event) => setConditionsText(event.target.value)}
            />
          </section>
        </div>
        <div className="template-actions flex flex-wrap justify-end gap-3 px-5 py-4">
          <button type="button" className="credit-chip template-preview-action" onClick={() => setPreviewMode((current) => !current)}>
            <Eye size={16} /> {previewMode ? "Editar plantilla" : "Previsualizar mensaje"}
          </button>
          {previewMode ? (
            <button type="button" className="btn-blue" onClick={() => onCopy(preview)}><Copy size={16} /> Copiar vista previa</button>
          ) : null}
          <button type="button" className="btn-green" onClick={() => onSave(slot, text, conditionsText)}><Save size={16} /> Guardar plantilla</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </section>
    </div>
  );
}

function ProductAccountsModal({
  product,
  accounts,
  onClose,
  onOpenDelivery
}: {
  product: ProductRow;
  accounts: AccountRow[];
  onClose: () => void;
  onOpenDelivery: (account: AccountRow) => void;
}) {
  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[145px]">
      <section className="modal-card relative max-h-[calc(100vh-170px)] w-[min(940px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-5 text-lg font-medium">Cuentas de {product.name}</h2>
        <table className="data-table">
          <thead><tr><th>#</th><th>Correo</th><th>Contraseña</th><th>Perfiles</th><th>Facturación</th><th>Acciones</th></tr></thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={account.id}>
                <td>{index + 1}</td>
                <td>{account.email}</td>
                <td>{account.password}</td>
                <td>{account.profiles.filter((profile) => profile.client).length}/{account.profiles.length}</td>
                <td>{dateOnly(account.billingDate)}</td>
                <td><button className="icon-action text-[#ffb300]" onClick={() => onOpenDelivery(account)}><Eye size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length ? <p className="mt-5 text-[#9a9da4]">Este servicio aún no tiene cuentas creadas.</p> : null}
      </section>
    </div>
  );
}

function ClientDetailModal({
  client,
  accounts,
  onClose,
  onCopyProfile,
  onNotifyProfile,
  onEditProfile,
  onRemoveProfile
}: {
  client: ClientRow;
  accounts: AccountRow[];
  onClose: () => void;
  onCopyProfile: (account: AccountRow, profile: AccountRow["profiles"][number]) => void;
  onNotifyProfile: (account: AccountRow, profile: AccountRow["profiles"][number]) => void;
  onEditProfile: (account: AccountRow, profile: AccountRow["profiles"][number]) => void;
  onRemoveProfile: (account: AccountRow, profile: AccountRow["profiles"][number]) => void;
}) {
  const rows = accounts.flatMap((account) =>
    account.profiles
      .filter((profile) => profile.client?.id === client.id)
      .map((profile) => ({ account, profile }))
  );
  const whatsappPhone = client.phone?.replace(/\D/g, "");

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[145px]">
      <section className="modal-card relative max-h-[calc(100vh-170px)] w-[min(980px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl">
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2 className="mb-1 text-lg font-medium">Detalle de cuenta</h2>
        <h3 className="mb-5 text-base font-bold">
          {client.name}
          {client.phone ? (
            <button
              type="button"
              className="client-whatsapp-link ml-3"
              onClick={() => {
                const greeting = encodeURIComponent(`Hola ${client.name}, ¿cómo estás?`);
                if (whatsappPhone) window.open(`https://wa.me/${whatsappPhone}?text=${greeting}`, "_blank", "noopener,noreferrer");
              }}
              title="Abrir WhatsApp con saludo"
            >
              <MessageCircle className="inline-block align-[-3px]" size={17} /> {client.phone}
            </button>
          ) : null}
        </h3>
        <table className="data-table">
          <thead><tr><th>#</th><th>Correo</th><th>Contraseña</th><th>Vencimiento</th><th>Nombre Perfil</th><th>PIN</th><th>Acciones</th></tr></thead>
          <tbody>
            {rows.map(({ account, profile }, index) => (
              <tr key={profile.id}>
                <td>{index + 1}</td>
                <td><ProductBadge name={account.product.name} color={account.product.color} imageUrl={account.product.imageUrl} />{account.email}</td>
                <td>{account.password}</td>
                <td>{dateOnly(profile.dueDate)}</td>
                <td>{profile.name}</td>
                <td>{profile.pin || "-"}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="icon-action text-[#03a9f4]" title="Notificar por WhatsApp" onClick={() => onNotifyProfile(account, profile)}><Bell size={17} /></button>
                    <button className="icon-action text-[#00d267]" title="Copiar información" onClick={() => onCopyProfile(account, profile)}><UserRoundCheck size={17} /></button>
                    <button className="icon-action text-[#cfd2d8]" title="Editar perfil" onClick={() => onEditProfile(account, profile)}><Edit3 size={17} /></button>
                    <button className="icon-action text-[#ff174f]" title="Eliminar cliente del perfil" onClick={() => onRemoveProfile(account, profile)}><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="mt-5 text-[#9a9da4]">Este cliente no tiene perfiles asignados todavía.</p> : null}
        <div className="mt-6 flex justify-end"><button className="btn-pink" onClick={onClose}>× Cancelar</button></div>
      </section>
    </div>
  );
}

function ProfileAssignmentModal({
  account,
  profile,
  profileIndex,
  clients,
  providers,
  combos,
  saving,
  onClose,
  onSave
}: {
  account: AccountRow;
  profile: AccountRow["profiles"][number];
  profileIndex: number;
  clients: ClientRow[];
  providers: ProviderRow[];
  combos: ComboRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (profile: AccountDraft["profiles"][number]) => void;
}) {
  const [clientId, setClientId] = useState(profile.client?.id || "");
  const [name, setName] = useState(profile.name || `Perfil ${profileIndex + 1}`);
  const [pin, setPin] = useState(profile.pin || "");
  const [dueDate, setDueDate] = useState(dateInput(profile.dueDate));
  const [generatePayment, setGeneratePayment] = useState(profile.soldCents > 0);
  const [soldCents, setSoldCents] = useState(profile.soldCents || 0);
  const [saleMode, setSaleMode] = useState<"individual" | "combo">("individual");
  const [comboId, setComboId] = useState("");
  const selectedClient = clients.find((client) => client.id === clientId);
  const providerOptions = providers
    .map((provider) => {
      const offer = provider.offers.find((item) => item.productId === account.product.id);
      return offer ? { provider, offer } : null;
    })
    .filter(Boolean) as Array<{ provider: ProviderRow; offer: ProviderRow["offers"][number] }>;
  const defaultProviderOfferId =
    providerOptions.find(({ provider }) => provider.id === account.provider?.id)?.offer.id ||
    providerOptions[0]?.offer.id ||
    "";
  const [providerOfferId, setProviderOfferId] = useState(defaultProviderOfferId);
  const selectedProviderOption = providerOptions.find(({ offer }) => offer.id === providerOfferId) || null;
  const matchingCombos = combos.filter((combo) => comboIncludesProduct(combo, account.product.name));
  const selectedCombo = matchingCombos.find((combo) => combo.id === comboId) || null;
  const allocatedComboIncome = selectedCombo ? allocatedComboSaleCents(selectedCombo, account.product.name) : 0;
  const allocatedComboCost = selectedCombo ? allocatedComboCostCents(selectedCombo, account.product.name) : 0;
  const allocatedComboProfit = allocatedComboIncome - allocatedComboCost;

  useEffect(() => {
    if (saleMode === "combo" && selectedCombo) {
      setGeneratePayment(true);
      setSoldCents(allocatedComboIncome);
    }
  }, [allocatedComboIncome, saleMode, selectedCombo]);

  return (
    <div className="modal-backdrop fixed inset-0 z-40 grid place-items-start pt-[125px]">
      <form
        className="modal-card assignment-modal relative max-h-[calc(100vh-145px)] w-[min(620px,calc(100vw-28px))] overflow-auto rounded-[18px] p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            name,
            pin,
            clientId,
            dueDate,
            soldCents: generatePayment ? soldCents : 0
          });
        }}
      >
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <div className="modal-product-title mb-9 flex items-center gap-3">
          <ProductBadge name={account.product.name} color={account.product.color} imageUrl={account.product.imageUrl} />
          <div>
            <h2 className="text-xl font-medium tracking-wide">{account.product.name}</h2>
            <small className="text-[#b9bcc4]">{account.email}</small>
          </div>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="field-label-required">Cliente *</span>
            <select className="input-line account-select" value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Seleccione un cliente</option>
              {clients.map((client) => (
                <option value={client.id} key={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {selectedClient ? <small className="text-[#9a9da4]">{selectedClient.phone || selectedClient.email || "Cliente registrado"}</small> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">Nombre perfil</span>
            <input className="input-line input-filled" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label className="grid gap-2">
            <span className="text-[#d0d2d7]">PIN</span>
            <input className="input-line" value={pin} onChange={(event) => setPin(event.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className="field-label-required">Próxima fecha cobro en: {daysLeft(dueDate)} días</span>
            <input className="input-line" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>

          <section className="payment-box">
            <label className="soft-toggle flex items-center gap-3">
              <input type="checkbox" checked={generatePayment} onChange={(event) => setGeneratePayment(event.target.checked)} />
              <span className="toggle-track" />
              <span>Generar pago</span>
            </label>
            {generatePayment ? (
              <div className="mt-5 grid gap-4">
                <div className="combo-mode-toggle">
                  <button
                    type="button"
                    className={saleMode === "individual" ? "combo-mode-active" : ""}
                    onClick={() => {
                      setSaleMode("individual");
                      setComboId("");
                    }}
                  >
                    Venta individual
                  </button>
                  <button
                    type="button"
                    className={saleMode === "combo" ? "combo-mode-active" : ""}
                    onClick={() => {
                      setSaleMode("combo");
                      if (!comboId && matchingCombos[0]) setComboId(matchingCombos[0].id);
                    }}
                    disabled={!matchingCombos.length}
                  >
                    Venta en combo
                  </button>
                </div>

                {saleMode === "individual" ? (
                  <div className="grid gap-4">
                    <label className="grid gap-2">
                      <span className="text-[11px] text-[#d0d2d7]">Proveedor de compra / referencia</span>
                      <select className="input-line account-select" value={providerOfferId} onChange={(event) => setProviderOfferId(event.target.value)}>
                        <option value="">Sin proveedor asignado</option>
                        {providerOptions.map(({ provider, offer }) => (
                          <option key={offer.id} value={offer.id}>
                            {provider.name} · Costo {money(offer.costCents)}
                          </option>
                        ))}
                      </select>
                      <small className="text-[#9a9da4]">
                        {selectedProviderOption
                          ? `Costo de referencia de ${account.product.name}: ${money(selectedProviderOption.offer.costCents)}.`
                          : `Costo registrado en la cuenta: ${money(account.purchaseCents)}.`}
                      </small>
                    </label>
                  </div>
                ) : null}

                {saleMode === "combo" ? (
                  <label className="grid gap-2">
                    <span className="text-[11px] text-[#d0d2d7]">Combo vendido</span>
                    <select className="input-line account-select" value={comboId} onChange={(event) => setComboId(event.target.value)}>
                      <option value="">Seleccione un combo</option>
                      {matchingCombos.map((combo) => (
                        <option key={combo.id} value={combo.id}>
                          {combo.name} · Venta {money(combo.saleCents)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {saleMode === "combo" && selectedCombo ? (
                  <div className="combo-summary-card">
                    <div>
                      <small>Venta total combo</small>
                      <strong>{money(selectedCombo.saleCents)}</strong>
                    </div>
                    <div>
                      <small>Ingreso asignado</small>
                      <strong>{money(allocatedComboIncome)}</strong>
                    </div>
                    <div>
                      <small>Ganancia asignada</small>
                      <strong className="text-[#00d267]">{money(allocatedComboProfit)}</strong>
                    </div>
                    <p>
                      {selectedCombo.items.map((item) => item.product.name).join(" + ")}
                      <span className="ml-2 text-[#9a9da4]">· Costo asignado {money(allocatedComboCost)}</span>
                    </p>
                  </div>
                ) : null}

                <label className="grid gap-2">
                  <span className="text-[11px] text-[#d0d2d7]">
                    {saleMode === "combo" ? "Ingreso asignado a esta plataforma *" : "Precio vendido al cliente *"}
                  </span>
                  <input
                    className="input-line"
                    type="number"
                    min={0}
                    value={soldCents / 100}
                    onChange={(event) => setSoldCents(Math.round(Number(event.target.value || 0) * 100))}
                  />
                  {saleMode === "combo" ? (
                    <small className="text-[#9a9da4]">
                      El sistema distribuye el precio del combo entre sus plataformas automáticamente. Esta cifra es editable para ajustar la ganancia real.
                    </small>
                  ) : (
                    <small className="text-[#9a9da4]">
                      Este es el valor real que le cobraste al cliente por este servicio individual.
                    </small>
                  )}
                </label>
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-green" disabled={saving}>{saving ? "Guardando..." : <><Save size={16} /> Guardar</>}</button>
          <button type="button" className="btn-pink" onClick={onClose}>× Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function HomeDashboard({
  products,
  accounts,
  clients,
  report,
  onGoAccounts,
  onGoSales
}: {
  products: ProductRow[];
  accounts: AccountRow[];
  clients: ClientRow[];
  report: BootstrapData["report"];
  onGoAccounts: () => void;
  onGoSales: () => void;
}) {
  const assignedProfiles = accounts.flatMap((account) =>
    account.profiles
      .filter((profile) => profile.client)
      .map((profile) => ({ account, profile }))
  );
  const expired = assignedProfiles.filter(({ profile }) => daysLeft(profile.dueDate) <= 0);
  const today = assignedProfiles.filter(({ profile }) => daysLeft(profile.dueDate) === 0);
  const tomorrow = assignedProfiles.filter(({ profile }) => daysLeft(profile.dueDate) === 1);
  const urgentCount = expired.length + today.length + tomorrow.length;
  const totalSoldProfiles = assignedProfiles.length;
  const upcoming = assignedProfiles
    .filter(({ profile }) => daysLeft(profile.dueDate) >= 0 && daysLeft(profile.dueDate) <= 5)
    .sort((a, b) => daysLeft(a.profile.dueDate) - daysLeft(b.profile.dueDate))
    .slice(0, 6);

  return (
    <section className="grid gap-5">
      <div className="premium-panel relative overflow-hidden rounded-[28px] p-7">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_35%,rgba(25,230,255,.28),transparent_35%),radial-gradient(circle_at_55%_85%,rgba(255,23,79,.2),transparent_32%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="rounded-full border border-[#19e6ff]/25 bg-[#19e6ff]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#19e6ff]">
              {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight max-md:text-3xl">Centro de control de Island Play</h1>
            <p className="mt-3 max-w-2xl text-[#b6bac4]">Ventas, vencimientos, margen y cuentas por renovar desde una sola cabina. Lo importante arriba; el ruido afuera.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-blue" onClick={onGoSales}><ShoppingCart size={16} /> Vender combo</button>
            <button className="btn-green" onClick={onGoAccounts}><Plus size={16} /> Nueva cuenta</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <Stat label="Alertas críticas" value={urgentCount} />
        <Stat label="Vencen hoy" value={today.length} />
        <Stat label="Ventas activas" value={totalSoldProfiles} />
        <Stat label="Ganancia acumulada" value={money(report.summary.profitCents)} />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <section className="premium-panel col-span-7 rounded-[24px] p-5 max-xl:col-span-12">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Pulso de servicios</h2>
              <p className="text-sm text-[#9a9da4]">Qué plataformas están generando ventas y cuáles concentran clientes activos.</p>
            </div>
            <span className="profit-pill">{products.length} servicios</span>
          </div>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {products.slice(0, 8).map((product) => {
              const productAccounts = accounts.filter((account) => account.product.id === product.id);
              const occupied = productAccounts.reduce((sum, account) => sum + account.profiles.filter((profile) => profile.client).length, 0);
              const revenue = productAccounts.reduce((sum, account) => sum + account.profiles.reduce((inner, profile) => inner + profile.soldCents, 0), 0);
              return (
                <article key={product.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-200 hover:-translate-y-1 hover:border-[#19e6ff]/40 hover:shadow-[0_16px_45px_rgba(25,230,255,.12)]">
                  <div className="mb-3 flex items-center gap-3">
                    <ProductBadge name={product.name} color={product.color} imageUrl={product.imageUrl} />
                    <b>{storeName(product.name)}</b>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-xl bg-[#00d267]/10 p-2 text-[#9cffc8]">{occupied} activos</span>
                    <span className="rounded-xl bg-[#19e6ff]/10 p-2 text-[#9eefff]">{money(revenue)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="premium-panel col-span-5 rounded-[24px] p-5 max-xl:col-span-12">
          <h2 className="text-lg font-black">Por cobrar / renovar</h2>
          <p className="mb-4 text-sm text-[#9a9da4]">Clientes con servicios vencidos o próximos a vencer.</p>
          <div className="grid gap-3">
            {upcoming.map(({ account, profile }) => (
              <article key={profile.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-3">
                  <ProductBadge name={account.product.name} color={account.product.color} imageUrl={account.product.imageUrl} />
                  <div>
                    <b>{profile.client?.name}</b>
                    <small className="block text-[#9a9da4]">{account.product.name} · {profile.name}</small>
                  </div>
                </div>
                <span className={`pill days-pill ${daysPillClass(daysLeft(profile.dueDate))}`}>{daysLeft(profile.dueDate)} días</span>
              </article>
            ))}
            {!upcoming.length ? <p className="rounded-2xl border border-white/10 p-4 text-[#9a9da4]">No tienes vencimientos urgentes. Respira, raro pero bonito.</p> : null}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        <Stat label="Clientes activos" value={clients.filter((client) => client.status === "ACTIVE").length} />
        <Stat label="Invertido" value={money(report.summary.investedCents)} />
        <Stat label="Ganancia acumulada" value={money(report.summary.profitCents)} />
      </section>
    </section>
  );
}

function Reports({
  report,
  onNewMovement,
  onEditMovement,
  onDeleteMovement
}: {
  report: BootstrapData["report"];
  onNewMovement: () => void;
  onEditMovement: (movement: MovementRow) => void;
  onDeleteMovement: (movement: MovementRow) => void;
}) {
  const [movementTypeFilter, setMovementTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">("all");
  const [movementQuery, setMovementQuery] = useState("");
  const incomeCents = report.movements.filter((movement) => movement.type === "INCOME").reduce((sum, movement) => sum + movement.amountCents, 0);
  const expenseCents = report.movements.filter((movement) => movement.type === "EXPENSE").reduce((sum, movement) => sum + movement.amountCents, 0);
  const netCents = incomeCents - expenseCents;
  const chartTotal = Math.max(incomeCents, expenseCents, 1);
  const filteredMovements = report.movements.filter((movement) => {
    const matchesType = movementTypeFilter === "all" || movement.type === movementTypeFilter;
    const matchesQuery = `${movement.concept} ${movement.type}`.toLowerCase().includes(movementQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  return (
    <section className="grid grid-cols-12 gap-4">
      <Stat label="Clientes activos" value={report.summary.activeClients} />
      <Stat label="Ingresos registrados" value={money(incomeCents)} />
      <Stat label="Gastos registrados" value={money(expenseCents)} />
      <Stat label="Balance neto" value={money(netCents)} />
      <div className="premium-panel col-span-12 rounded-[24px] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Finanzas operativas</h2>
            <p className="text-sm text-[#9a9da4]">Cada venta o gasto queda como movimiento para auditar qué se vendió, a quién y por cuánto.</p>
          </div>
          <button type="button" className="btn-green" onClick={onNewMovement}><Plus size={16} /> Agregar venta/gasto</button>
        </div>
        <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-1">
          <div className="rounded-2xl border border-[#00d267]/20 bg-[#00d267]/10 p-4">
            <small className="text-[#9a9da4]">Ingresos</small>
            <strong className="mt-1 block text-2xl text-[#00d267]">{money(incomeCents)}</strong>
          </div>
          <div className="rounded-2xl border border-[#ffb300]/20 bg-[#ffb300]/10 p-4">
            <small className="text-[#9a9da4]">Costos y gastos</small>
            <strong className="mt-1 block text-2xl text-[#ffcc47]">{money(expenseCents)}</strong>
          </div>
          <div className="rounded-2xl border border-[#19e6ff]/20 bg-[#19e6ff]/10 p-4">
            <small className="text-[#9a9da4]">Resultado</small>
            <strong className={`mt-1 block text-2xl ${netCents >= 0 ? "text-[#19e6ff]" : "text-[#ff174f]"}`}>{money(netCents)}</strong>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#9a9da4]"><span>Ingresos</span><span>{money(incomeCents)}</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#00d267] to-[#19e6ff]" style={{ width: `${Math.round((incomeCents / chartTotal) * 100)}%` }} /></div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-[#9a9da4]"><span>Gastos</span><span>{money(expenseCents)}</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#ffb300] to-[#ff174f]" style={{ width: `${Math.round((expenseCents / chartTotal) * 100)}%` }} /></div>
          </div>
        </div>
      </div>
      <div className="premium-panel col-span-12 rounded-[18px] p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-bold">Movimientos recientes</h2>
          <div className="flex flex-wrap gap-2">
            <select className="input-line w-[180px]" value={movementTypeFilter} onChange={(event) => setMovementTypeFilter(event.target.value as "all" | "INCOME" | "EXPENSE")}>
              <option value="all">Todos</option>
              <option value="INCOME">Solo ingresos</option>
              <option value="EXPENSE">Solo gastos</option>
            </select>
            <input className="input-line w-[260px]" value={movementQuery} onChange={(event) => setMovementQuery(event.target.value)} placeholder="Buscar cliente, combo o concepto" />
          </div>
        </div>
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto detallado</th><th>Monto</th><th>Acciones</th></tr></thead>
          <tbody>
            {filteredMovements.map((movement) => (
              <tr key={movement.id}>
                <td>{dateOnly(movement.date)}</td>
                <td><span className={`status-pill ${movement.type === "INCOME" ? "status-active" : "status-inactive"}`}>{movement.type === "INCOME" ? "Ingreso" : "Gasto"}</span></td>
                <td>
                  <div className="grid gap-1">
                    <strong className="text-white">{movement.concept.split(" · ")[0]}</strong>
                    <span className="text-xs leading-relaxed text-[#9a9da4]">{movement.concept}</span>
                    <span className="text-[11px] text-[#6f7785]">Registrado: {dateOnly(movement.createdAt)}</span>
                  </div>
                </td>
                <td className={movement.type === "INCOME" ? "text-[#00d267]" : "text-[#ffb300]"}>{money(movement.amountCents)}</td>
                <td>
                  <div className="flex gap-2">
                    <button type="button" className="icon-action text-[#cfd2d8]" title="Editar movimiento" onClick={() => onEditMovement(movement)}><Edit3 size={17} /></button>
                    <button type="button" className="icon-action text-[#ff174f]" title="Eliminar movimiento" onClick={() => onDeleteMovement(movement)}><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredMovements.length ? (
              <tr><td colSpan={5} className="text-[#9a9da4]">Aún no hay movimientos registrados.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="premium-panel col-span-12 rounded-[18px] p-5">
        <h2 className="mb-4 text-lg font-bold">Rentabilidad por cuenta</h2>
        <table className="data-table">
          <thead><tr><th>Cuenta</th><th>Proveedor</th><th>Costo</th><th>Vendido</th><th>Ganancia</th></tr></thead>
          <tbody>
            {report.accounts.map((row) => (
              <tr key={row.id}><td>{row.product}</td><td>{row.provider || "-"}</td><td>{money(row.purchaseCents)}</td><td>{money(row.soldCents)}</td><td>{money(row.profitCents)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CombosTable({
  combos,
  onEdit,
  onDelete
}: {
  combos: ComboRow[];
  onEdit: (combo: ComboRow) => void;
  onDelete: (combo: ComboRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Combo</th>
            <th>Servicios incluidos</th>
            <th>Costo ref.</th>
            <th>Precio venta</th>
            <th>Ganancia</th>
            <th>Margen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {combos.map((combo, index) => {
            const profit = combo.saleCents - combo.costCents;
            const margin = combo.saleCents ? Math.round((profit / combo.saleCents) * 100) : 0;
            return (
              <tr key={combo.id}>
                <td>{index + 1}</td>
                <td>
                  <b>{combo.name}</b>
                  {combo.notes ? <small className="block text-[#9a9da4]">{combo.notes}</small> : null}
                </td>
                <td>
                  <div className="combo-service-list">
                    {combo.items.map((item) => (
                      <span key={item.id}>{item.product.name}</span>
                    ))}
                  </div>
                </td>
                <td>{money(combo.costCents)}</td>
                <td>{money(combo.saleCents)}</td>
                <td className="font-bold text-[#00d267]">{money(profit)}</td>
                <td><span className="profit-pill">{margin}%</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="icon-action text-[#cfd2d8]" title="Editar" onClick={() => onEdit(combo)}><Edit3 size={17} /></button>
                    <button className="icon-action text-[#ff174f]" title="Eliminar" onClick={() => onDelete(combo)}><Trash2 size={17} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!combos.length ? (
            <tr><td colSpan={8} className="py-8 text-center text-[#9a9da4]">No hay combos que coincidan con la búsqueda.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="premium-card col-span-3 grid min-h-[105px] gap-2 rounded-[18px] p-5 max-lg:col-span-12">
      <small className="text-[#9a9da4]">{label}</small>
      <b className="text-2xl">{value}</b>
    </article>
  );
}

function makeIndividualSaleDraft(
  product: ProductRow | undefined,
  accounts: AccountRow[],
  providers: ProviderRow[],
  dueDate: string
): IndividualSaleDraft {
  const account = product
    ? accounts.find((row) => row.product.id === product.id && row.profiles.some((profile) => !profile.client))
    : undefined;
  const profile = account?.profiles.find((row) => !row.client);
  const providerOption = product
    ? providers
      .flatMap((provider) => provider.offers.map((offer) => ({ provider, offer })))
      .find((item) => item.offer.productId === product.id)
    : undefined;
  const profileCost = account
    ? roundPesosToCents(account.purchaseCents / Math.max(account.profiles.length, 1))
    : providerOption?.offer.costCents || product?.costCents || 0;

  return {
    productId: product?.id || "",
    mode: account && profile ? "EXISTING" : "CREATE",
    accountId: account?.id || "",
    profileId: profile?.id || "",
    providerId: providerOption?.provider.id || "",
    clientId: "",
    client: {
      name: "",
      phone: "",
      email: "",
      notes: ""
    },
    email: "",
    password: "",
    purchaseCents: profileCost,
    soldCents: product?.priceCents || 0,
    profileName: profile?.name || "Perfil 1",
    pin: profile?.pin || "1001",
    dueDate,
    notes: ""
  };
}

function buildComboSaleDraft(combo: ComboRow | undefined, accounts: AccountRow[], dueDate: string): ComboSaleDraft {
  const items = combo?.items.map((item, index) => {
    const account = accounts.find((row) => row.product.id === item.productId && row.profiles.some((profile) => !profile.client));
    const profile = account?.profiles.find((row) => !row.client);
    const purchaseCents = account
      ? roundPesosToCents(account.purchaseCents / Math.max(account.profiles.length, 1))
      : allocatedComboCostCents(combo, item.product.name);
    return {
      productId: item.productId,
      mode: account && profile ? "EXISTING" as const : "CREATE" as const,
      accountId: account?.id || "",
      profileId: profile?.id || "",
      providerId: "",
      email: "",
      password: "",
      purchaseCents,
      profileName: profile?.name || `Perfil ${index + 1}`,
      pin: profile?.pin || "",
      dueDate,
      soldCents: 0
    };
  }) || [];
  const allocations = allocateByWeights(items.map((item) => item.purchaseCents), combo?.saleCents || 0);
  return {
    comboId: combo?.id || "",
    clientId: "",
    client: {
      name: "",
      phone: "",
      email: "",
      notes: ""
    },
    dueDate,
    totalSaleCents: combo?.saleCents || 0,
    notes: "",
    items: items.map((item, index) => ({ ...item, soldCents: allocations[index] || 0 }))
  };
}

function allocateComboSaleByProduct(combo: ComboRow | null | undefined, totalSaleCents: number) {
  if (!combo?.items.length) return {} as Record<string, number>;
  const allocations: Record<string, number> = {};
  let assigned = 0;
  combo.items.forEach((item, index) => {
    const amount = index === combo.items.length - 1
      ? totalSaleCents - assigned
      : allocatedComboSaleCents(combo, item.product.name);
    allocations[item.productId] = Math.max(0, amount);
    assigned += amount;
  });
  return allocations;
}

function roundPesosToCents(cents: number) {
  return Math.max(0, Math.round(cents / 100) * 100);
}

function allocateByWeights(weights: number[], totalCents: number) {
  if (!weights.length) return [];
  const safeTotal = roundPesosToCents(totalCents);
  const safeWeights = weights.map((weight) => roundPesosToCents(weight));
  const weightTotal = safeWeights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;

  return safeWeights.map((weight, index) => {
    if (index === safeWeights.length - 1) return Math.max(0, safeTotal - assigned);
    const denominator = weightTotal || safeWeights.length;
    const weightedValue = weightTotal ? (safeTotal * weight) / denominator : safeTotal / denominator;
    const value = Math.min(roundPesosToCents(weightedValue), Math.max(0, safeTotal - assigned));
    assigned += value;
    return value;
  });
}

function exportRowsXlsx(filename: string, sheetName: string, rows: Array<Record<string, string | number>>) {
  const headers = rows[0] ? Object.keys(rows[0]) : ["Sin datos"];
  const matrix = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${matrix.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      const text = escapeXml(String(value));
      return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
    }).join("")}</row>`).join("")}
  </sheetData>
</worksheet>`;

  const files: Record<string, string> = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    "xl/worksheets/sheet1.xml": sheetXml
  };

  const blob = new Blob([makeZip(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function readFirstSheetXlsx(file: File) {
  const entries = await unzipXlsx(await file.arrayBuffer());
  const sheet = entries["xl/worksheets/sheet1.xml"] || Object.entries(entries).find(([name]) => name.startsWith("xl/worksheets/sheet"))?.[1];
  if (!sheet) throw new Error("No encontré hojas dentro del archivo XLSX.");
  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
  const rows = parseSheetRows(sheet, sharedStrings);
  const headerRow = rows.find((row) => row.some(Boolean));
  if (!headerRow) return [];
  const headerIndex = rows.indexOf(headerRow);
  const headers = headerRow.map((value, index) => String(value || `Columna ${index + 1}`).trim());
  return rows.slice(headerIndex + 1).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()]))
  ).filter((row) => Object.values(row).some(Boolean));
}

function parseSharedStrings(xml?: string) {
  if (!xml) return [];
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName("si")).map((node) =>
    Array.from(node.getElementsByTagName("t")).map((text) => text.textContent || "").join("")
  );
}

function parseSheetRows(xml: string, sharedStrings: string[]) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagName("row")).map((row) => {
    const cells = Array.from(row.getElementsByTagName("c"));
    const values: string[] = [];
    for (const cell of cells) {
      const ref = cell.getAttribute("r") || "";
      const column = columnIndex(ref.replace(/\d/g, ""));
      const type = cell.getAttribute("t");
      const raw = cell.getElementsByTagName("v")[0]?.textContent || "";
      const inline = cell.getElementsByTagName("t")[0]?.textContent || "";
      values[column] = type === "s" ? sharedStrings[Number(raw)] || "" : type === "inlineStr" ? inline : raw;
    }
    return values;
  });
}

async function unzipXlsx(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("Archivo XLSX inválido.");
  const entriesCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries: Record<string, string> = {};

  for (let index = 0; index < entriesCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    if (name.endsWith(".xml")) {
      if (method === 0) entries[name] = decoder.decode(compressed);
      else if (method === 8) entries[name] = decoder.decode(await inflateRaw(compressed));
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

async function inflateRaw(data: Uint8Array) {
  if (!("DecompressionStream" in globalThis)) throw new Error("Este navegador no puede descomprimir XLSX importados.");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function makeZip(files: Record<string, string>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    central.push(centralHeader);
    offset += local.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = central.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, central.length, true);
  endView.setUint16(10, central.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, centralOffset, true);
  return concatBytes([...chunks, ...central, end]);
}

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]) {
  const output = new Uint8Array(chunks.reduce((sum, item) => sum + item.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const rest = (value - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    value = Math.floor((value - rest) / 26);
  }
  return name;
}

function columnIndex(name: string) {
  return name.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeImportRow(row: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"),
      value
    ])
  ) as Record<string, string>;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  return {
    items: items.slice(startIndex, startIndex + pageSize),
    startIndex,
    totalPages
  };
}

function money(cents: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cents / 100);
}

const COMBO_REFERENCE_COSTS_CENTS: Record<string, number> = {
  netflix: 860000,
  disney: 850000,
  max: 420000,
  prime: 350000,
  crunchyroll: 390000,
  vix: 200000,
  paramount: 550000,
  spotify: 650000
};

function normalizeService(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function serviceKey(value: string) {
  const normalized = normalizeService(value);
  if (normalized.includes("netflix")) return "netflix";
  if (normalized.includes("disney")) return "disney";
  if (normalized.includes("prime") || normalized.includes("amazon")) return "prime";
  if (normalized.includes("crunchy")) return "crunchyroll";
  if (normalized.includes("paramount")) return "paramount";
  if (normalized.includes("spotify")) return "spotify";
  if (normalized.includes("vix")) return "vix";
  if (normalized.includes("max") || normalized.includes("hbomax")) return "max";
  return normalized;
}

function comboIncludesProduct(combo: ComboRow, productName: string) {
  const productKey = serviceKey(productName);
  return combo.items.some((item) => serviceKey(item.product.name) === productKey);
}

function allocatedComboSaleCents(combo: ComboRow, productName: string) {
  return allocatedComboAmountCents(combo, productName, combo.saleCents);
}

function allocatedComboCostCents(combo: ComboRow, productName: string) {
  return allocatedComboAmountCents(combo, productName, combo.costCents);
}

function allocatedComboAmountCents(combo: ComboRow, productName: string, amountCents: number) {
  const productKey = serviceKey(productName);
  const totalReference = combo.items.reduce((sum, item) => sum + (COMBO_REFERENCE_COSTS_CENTS[serviceKey(item.product.name)] || 0), 0);
  const productReference = COMBO_REFERENCE_COSTS_CENTS[productKey] || 0;
  if (!totalReference || !productReference) return Math.round(amountCents / Math.max(combo.items.length, 1));
  return Math.round((amountCents * productReference) / totalReference);
}

function whatsappUrl(phone: string | null | undefined, message?: string) {
  const normalizedPhone = phone?.replace(/\D/g, "");
  if (!normalizedPhone) return null;
  const cleanMessage = message ? toWhatsappSafeText(message) : "";
  const encodedText = cleanMessage ? `&text=${encodeURIComponent(cleanMessage)}` : "";
  return `https://api.whatsapp.com/send?phone=${normalizedPhone}${encodedText}`;
}

function toWhatsappSafeText(value: string) {
  const normalized = value.normalize("NFC");
  if ("toWellFormed" in String.prototype) {
    return (normalized as unknown as { toWellFormed: () => string }).toWellFormed();
  }
  return normalized.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
}

function daysLeft(value: string) {
  const now = new Date();
  const target = new Date(value);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
}

function daysPillClass(days: number) {
  if (days <= 1) return "days-pill-red";
  if (days <= 2) return "days-pill-orange";
  if (days <= 4) return "days-pill-yellow";
  return "days-pill-green";
}

function dateOnly(value: string) {
  return new Date(value).toLocaleDateString("es-CO");
}

function dateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function accountToDraft(account: AccountRow): AccountDraft {
  return {
    productId: account.product.id,
    providerId: account.provider?.id || "",
    email: account.email,
    password: account.password,
    notes: "",
    billingDate: dateInput(account.billingDate),
    purchaseCents: account.purchaseCents,
    hidden: account.hidden,
    profiles: account.profiles.map((profile) => ({
      name: profile.name,
      pin: profile.pin || "",
      clientId: profile.client?.id || "",
      dueDate: dateInput(profile.dueDate),
      soldCents: profile.soldCents
    }))
  };
}

function stockForProduct(productId: string, accounts: AccountRow[]) {
  return accounts
    .filter((account) => account.product.id === productId)
    .reduce((sum, account) => sum + account.profiles.filter((profile) => !profile.client).length, 0);
}

function storeName(name: string) {
  const normalized = name.toLowerCase().includes("netflix") ? "Netflix Perfil Extra" : `${name} 1Mes`;
  return normalized;
}

function resizeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
      image.onload = () => {
        const maxSize = 512;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas no disponible."));
          return;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.86));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function mergeTemplateSlots(saved: string[] | undefined, defaults: string[]) {
  return defaults.map((fallback, index) => saved?.[index] || fallback);
}

function renderTemplate(template: string, data: {
  service: string;
  client: string;
  email: string;
  password: string;
  profile: string;
  pin: string;
  dueDate: string;
  paymentAccount: string;
  comboServices?: string;
  conditions?: string;
}) {
  return template
    .replaceAll("{{nombre_servicio}}", data.service)
    .replaceAll("{{servicio}}", data.service)
    .replaceAll("{{cliente}}", data.client)
    .replaceAll("{{correo}}", data.email)
    .replaceAll("{{contraseña}}", data.password)
    .replaceAll("{{password}}", data.password)
    .replaceAll("{{perfil}}", data.profile)
    .replaceAll("{{pin}}", data.pin)
    .replaceAll("{{fecha_vencimiento}}", data.dueDate)
    .replaceAll("{{vence}}", data.dueDate)
    .replaceAll("{{cuenta_pago}}", data.paymentAccount)
    .replaceAll("{{servicios_combo}}", data.comboServices || "")
    .replaceAll("{{condiciones_uso}}", data.conditions || DEFAULT_USAGE_CONDITIONS);
}

function buildDeliveryMessage(account: AccountRow, selectedProfile?: AccountRow["profiles"][number], templateLibrary?: TemplateLibrary) {
  const profiles = selectedProfile ? [selectedProfile] : account.profiles;
  const firstAssigned = selectedProfile || account.profiles.find((profile) => profile.client) || account.profiles[0];
  const validUntil = firstAssigned?.dueDate || account.billingDate;
  const dueDate = new Date(validUntil).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const template = templateLibrary?.delivery[0] || DEFAULT_DELIVERY_TEMPLATES[0];
  if (template) {
    const profileSummary = profiles.map((profile) => profile.name).join(", ");
    const pinSummary = profiles.map((profile) => profile.pin || "-").join(", ");
    const clientSummary = profiles.map((profile) => profile.client?.name).filter(Boolean).join(", ") || "Cliente";
    return renderTemplate(template, {
      service: account.product.name,
      client: clientSummary,
      email: account.email,
      password: account.password,
      profile: profileSummary,
      pin: pinSummary,
      dueDate,
      paymentAccount: "NEQUI / Bancolombia",
      comboServices: "",
      conditions: templateLibrary?.conditions || DEFAULT_USAGE_CONDITIONS
    });
  }

  const lines = [
    `🔴 ${account.product.name} CUENTA 30 DIAS 🍿🔥🎬`,
    "",
    `Correo: ${account.email}`,
    `Contraseña: ${account.password}`,
    "",
    ...profiles.map((profile) => {
      const client = profile.client ? `\nCliente: ${profile.client.name}` : "";
      return `✓ PERFIL: ${profile.name}\n✓ PIN: ${profile.pin || "-"}${client}`;
    }),
    "",
    "¡1 SOLO DISPOSITIVO! NO modificar, NO compartir, NO ingresar a ningún PIN ajeno.",
    "",
    "Servicio sujeto a futuras actualizaciones de la plataforma.",
    "",
    `VÁLIDO HASTA: ${dueDate}`,
    "",
    "SOPORTE DE 10AM A 10PM",
    "",
    "Gracias por tu compra."
  ];

  return lines.join("\n");
}

function buildClientDeliveryMessage(entries: DeliveryEntry[], templateLibrary?: TemplateLibrary, client?: ClientRow | null) {
  const clientName =
    client?.name ||
    entries.find((entry) => entry.profile?.client?.name)?.profile?.client?.name ||
    "cliente";
  const cleanEntries = entries.filter((entry) => entry.account);
  if (cleanEntries.length <= 1) {
    const entry = cleanEntries[0];
    if (!entry) return `Hola ${clientName} 👋`;
    const selectedProfile =
      entry.profile ||
      entry.account.profiles.find((profile) => profile.client?.id === client?.id) ||
      entry.account.profiles.find((profile) => profile.client) ||
      entry.account.profiles[0];
    return buildDeliveryMessage(entry.account, selectedProfile, templateLibrary);
  }

  const comboServices = cleanEntries.map((entry) => {
    const selectedProfile =
      entry.profile ||
      entry.account.profiles.find((profile) => profile.client?.id === client?.id) ||
      entry.account.profiles.find((profile) => profile.client) ||
      entry.account.profiles[0];
    const validUntil = selectedProfile?.dueDate || entry.account.billingDate;
    const dueDate = new Date(validUntil).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

    return [
      `• *${entry.account.product.name}*`,
      `  Correo: ${entry.account.email}`,
      `  Clave: ${entry.account.password}`,
      `  Perfil: ${selectedProfile?.name || "-"} · PIN: ${selectedProfile?.pin || "-"}`,
      `  Vence: ${dueDate}`
    ].join("\n");
  }).join("\n\n");
  const firstEntry = cleanEntries[0];
  const firstProfile =
    firstEntry.profile ||
    firstEntry.account.profiles.find((profile) => profile.client?.id === client?.id) ||
    firstEntry.account.profiles.find((profile) => profile.client) ||
    firstEntry.account.profiles[0];
  const firstDueDate = new Date(firstProfile?.dueDate || firstEntry.account.billingDate).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const template = templateLibrary?.delivery[1] || DEFAULT_DELIVERY_TEMPLATES[1];

  return renderTemplate(template, {
    service: cleanEntries.map((entry) => entry.account.product.name).join(" + "),
    client: clientName,
    email: "",
    password: "",
    profile: "",
    pin: "",
    dueDate: firstDueDate,
    paymentAccount: "NEQUI / Bancolombia",
    comboServices,
    conditions: templateLibrary?.conditions || DEFAULT_USAGE_CONDITIONS
  });
}
