import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const executablePath = process.env.BROWSER_PATH || "/opt/google/chrome/chrome";
const outDir = path.resolve("docs/research/larsa");
const shotDir = path.resolve("docs/design-references/larsa");
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
await page.fill("input[autocomplete='email']", "admin@larsaplay.local");
await page.fill("input[autocomplete='current-password']", "admin123");
await page.click("button[type='submit']");
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(shotDir, "accounts-desktop.png"), fullPage: true });

const bodyText = await page.locator("body").innerText();
await fs.writeFile(path.join(outDir, "body.txt"), bodyText);
await fs.writeFile(path.join(outDir, "snapshot.json"), JSON.stringify({
  url: page.url(),
  bodyText,
  buttons: await page.locator("button").evaluateAll((els) => els.map((el) => el.textContent?.trim())),
  tables: await page.locator("table").evaluateAll((tables) => tables.map((table) => ({
    headers: [...table.querySelectorAll("th")].map((th) => th.textContent?.trim()),
    rows: [...table.querySelectorAll("tbody tr")].slice(0, 8).map((tr) => [...tr.children].map((td) => td.textContent?.trim()))
  })))
}, null, 2));

await browser.close();
console.log("Extracción local guardada en docs/research/larsa");
