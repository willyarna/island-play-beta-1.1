import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: process.env.BROWSER_PATH || "/opt/google/chrome/chrome",
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const baseUrl = process.env.LARSA_URL || "http://127.0.0.1:3000";

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.getByLabel("Correo").fill("admin@larsaplay.local");
await page.locator('input[autocomplete="current-password"]').fill("admin123");
await page.getByRole("button", { name: "Entrar a Larsa Play" }).click();
await page.waitForURL(`${baseUrl}/`, { waitUntil: "networkidle" });
await page.getByText("Listado de cuentas", { exact: true }).waitFor();

console.log("Inicio de sesión verificado: el panel principal está visible.");
await browser.close();
