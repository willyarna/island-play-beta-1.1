import { chromium } from "playwright";
import path from "node:path";

const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || "/opt/google/chrome/chrome", headless: true });
const baseUrl = process.env.LANDING_URL || "http://127.0.0.1:3000";

for (const viewport of [
  { name: "desktop", width: 1600, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const diagnostics = await page.evaluate(async () => {
    const root = document.querySelector(".lp-page");
    const links = [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean);
    const css = links[0] ? await fetch(links[0]).then((response) => response.text()) : "";
    return {
      styleSheets: [...document.styleSheets].map((sheet) => sheet.href ?? "inline"),
      cssLength: css.length,
      hasLandingRules: css.includes(".lp-page"),
      hasWorkspaceCorrection: css.includes("Corrección de composición"),
      cssTail: css.slice(-220),
      background: root ? getComputedStyle(root).backgroundColor : "missing",
      display: root ? getComputedStyle(root).display : "missing",
      width: root ? getComputedStyle(root).width : "missing"
    };
  });
  console.log(viewport.name, diagnostics);
  await page.screenshot({ path: path.resolve(`docs/design-references/larsa/landing-${viewport.name}.png`), fullPage: true });
  await page.close();
}

await browser.close();
console.log("Capturas de la landing generadas.");
