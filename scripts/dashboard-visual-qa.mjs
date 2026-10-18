import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.LOOM_DASHBOARD_URL ?? "http://127.0.0.1:4175";
const outputDir = process.env.LOOM_UI_QA_DIR ?? "/tmp/loom-ui-qa";
await mkdir(outputDir, { recursive: true });

function targetUrl(route) {
  if (process.env.LOOM_DASHBOARD_URL || process.env.VITE_LOOM_REPORT_URL) return `${baseUrl}${route}`;
  const sep = route.includes("?") ? "&" : "?";
  return `${baseUrl}${route}${sep}demo=true`;
}

const browser = await chromium.launch({ headless: true });
const consoleErrors = [];
const failedRequests = [];
const results = [];
const routes = [
  ["overview", "/"],
  ["findings", "/findings"],
  ["verification", "/verification"],
  ["reports", "/reports"],
  ["brand", "/brand"],
];

const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`));

for (const [name, route] of routes) {
  await page.goto(targetUrl(route), { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
  results.push({ name, overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), dimensions: await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, height: document.documentElement.scrollHeight })) });
}

await page.goto(targetUrl("/findings"), { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Open finding Retry can duplicate an order/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outputDir}/finding-detail.png`, fullPage: true });
results.push({ name: "finding-detail", inspector: await page.getByRole("complementary", { name: "Finding evidence inspector" }).count(), evidenceCards: await page.locator(".evidence-card").count(), evidencePaths: await page.getByLabel(/Evidence path/).count() });

await page.goto(targetUrl("/graph?finding=finding-retry-boundary"), { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Changed only/ }).click();
await page.getByPlaceholder("Find a node or path").fill("checkout");
await page.waitForTimeout(300);
await page.screenshot({ path: `${outputDir}/graph.png`, fullPage: true });
results.push({ name: "graph-controls", matched: await page.locator(".graph-match-count").textContent(), inspector: await page.getByRole("complementary", { name: "Node inspector" }).count(), graphNodes: await page.locator(".react-flow__node").count() });
await context.close();

// Multi-viewport matrix testing (1280x800, 1024x768, 768x1024)
const viewports = [
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
];

for (const vp of viewports) {
  const vpContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const vpPage = await vpContext.newPage();
  await vpPage.goto(targetUrl("/"), { waitUntil: "networkidle" });
  await vpPage.waitForTimeout(300);
  results.push({
    name: `overview-${vp.name}`,
    overflow: await vpPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    dimensions: await vpPage.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, height: document.documentElement.scrollHeight })),
  });
  await vpContext.close();
}

const narrowContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const narrowPage = await narrowContext.newPage();
for (const [name, route] of [["overview-narrow", "/"], ["findings-narrow", "/findings"], ["graph-narrow", "/graph"]]) {
  await narrowPage.goto(targetUrl(route), { waitUntil: "networkidle" });
  await narrowPage.waitForTimeout(300);
  await narrowPage.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
  results.push({ name, overflow: await narrowPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), dimensions: await narrowPage.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth, height: document.documentElement.scrollHeight })) });
}
await narrowContext.close();
await browser.close();

console.log(JSON.stringify({ results, consoleErrors, failedRequests, outputDir }, null, 2));
if (consoleErrors.length || failedRequests.length || results.some((result) => result.overflow)) process.exitCode = 1;
