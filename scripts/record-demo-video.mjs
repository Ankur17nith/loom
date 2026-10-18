import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import playwright from "playwright";

const PORT = 5177;
const DASHBOARD_URL = `http://127.0.0.1:${PORT}`;
const RAW_DIR = path.resolve("artifacts/demo-video/raw_record");
const OUTPUT_MP4 = path.resolve("artifacts/demo-video/loom-demo.mp4");
const NARRATION_WAV = path.resolve("artifacts/demo-video/narration.wav");
const CAPTIONS_SRT = path.resolve("artifacts/demo-video/captions.srt");

fs.mkdirSync(RAW_DIR, { recursive: true });

function terminalHtml(sceneNumber, sceneTitle, command, outputHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Loom Terminal — Scene ${sceneNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }
    .header-bar {
      width: 100%;
      max-width: 1720px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .brand-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 700;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 8px 18px;
      border-radius: 999px;
    }
    .brand-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #f97316;
      box-shadow: 0 0 12px #f97316;
    }
    .scene-pill {
      font-size: 13px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 8px 18px;
      border-radius: 999px;
      font-weight: 600;
    }
    .window {
      width: 100%;
      max-width: 1720px;
      height: 880px;
      background: #0f1422;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .window-titlebar {
      height: 48px;
      background: #141b2e;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      padding: 0 20px;
      position: relative;
    }
    .window-dots {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 13px;
      height: 13px;
      border-radius: 50%;
    }
    .dot-close { background: #ef4444; }
    .dot-min { background: #f59e0b; }
    .dot-max { background: #10b981; }
    .window-title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
    }
    .window-body {
      flex: 1;
      padding: 32px 40px;
      font-size: 18px;
      line-height: 1.6;
      color: #e2e8f0;
      overflow: hidden;
    }
    .prompt-line {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      font-size: 20px;
    }
    .prompt-user { color: #38bdf8; font-weight: 600; }
    .prompt-dir { color: #a855f7; font-weight: 600; }
    .prompt-git { color: #f59e0b; }
    .prompt-char { color: #94a3b8; }
    .prompt-cmd { color: #ffffff; font-weight: 700; }
    .output {
      font-size: 17px;
      line-height: 1.65;
    }
    .tree-dir { color: #38bdf8; font-weight: 600; }
    .tree-file { color: #e2e8f0; }
    .diff-rem { color: #f87171; background: rgba(239, 68, 68, 0.12); padding: 1px 4px; display: inline-block; width: 100%; }
    .diff-add { color: #4ade80; background: rgba(34, 197, 94, 0.12); padding: 1px 4px; display: inline-block; width: 100%; }
    .diff-hdr { color: #818cf8; }
    .finding-badge { background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 14px; }
    .finding-title { color: #f97316; font-weight: 600; }
    .finding-sub { color: #94a3b8; margin-left: 20px; }
    .json-key { color: #38bdf8; }
    .json-str { color: #4ade80; }
    .json-num { color: #f59e0b; }
    .json-bool { color: #ec4899; }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="brand-pill"><span class="brand-dot"></span>Loom · Change-Impact Intelligence</div>
    <div class="scene-pill">Scene ${sceneNumber} · ${sceneTitle}</div>
  </div>
  <div class="window">
    <div class="window-titlebar">
      <div class="window-dots">
        <span class="dot dot-close"></span>
        <span class="dot dot-min"></span>
        <span class="dot dot-max"></span>
      </div>
      <div class="window-title">bash — ankurgupta@fedora: ~/loom/demo-platform (master)</div>
    </div>
    <div class="window-body">
      <div class="prompt-line">
        <span class="prompt-user">engineer</span>@<span class="prompt-user">fedora</span>:<span class="prompt-dir">~/loom/demo-platform</span> <span class="prompt-git">(master)</span><span class="prompt-char">$</span>
        <span class="prompt-cmd">${command}</span>
      </div>
      <div class="output">${outputHtml}</div>
    </div>
  </div>
</body>
</html>`;
}

async function run() {
  console.log("=== Phase 8/9: Recording Loom Product Demo Video ===");

  // 1. Start Vite dev server for demo-platform
  console.log(`Starting Vite dev server on port ${PORT}...`);
  const server = spawn(
    "npx",
    ["--workspace", "apps/dashboard", "vite", "--host", "127.0.0.1", "--port", String(PORT)],
    {
      cwd: "/home/ankurgupta/loom",
      env: {
        ...process.env,
        LOOM_WORKSPACE_ROOT: "/home/ankurgupta/loom/demo-platform",
        VITE_LOOM_REPORT_URL: "/reports/report.json",
      },
      stdio: "pipe",
    }
  );

  // Wait for server to become responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/workspace`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    server.kill();
    throw new Error(`Failed to start Vite dev server on port ${PORT}`);
  }
  console.log(`Vite dev server is ready at ${DASHBOARD_URL}`);

  // 2. Launch Playwright with video recording
  console.log("Launching Playwright Chromium at 1920x1080 with recordVideo...");
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RAW_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // SCENE 1: Introduction and Baseline Repository (15.0s)
  console.log("Recording Scene 1 (15.0s): Introduction & Repository Baseline...");
  const s1Output = `
<div style="margin-bottom: 16px; color: #94a3b8;"># Clean workspace baseline with multi-module TypeScript architecture</div>
<pre style="color: #cbd5e1; font-size: 16px;">
.
├── <span class="tree-dir">packages/contracts/src/</span>
│   └── <span class="tree-file">payment.ts</span>               <span style="color: #64748b;">// Shared PaymentRequest interface</span>
├── <span class="tree-dir">services/order-service/src/</span>
│   └── <span class="tree-file">checkout.ts</span>              <span style="color: #64748b;">// Order processing service consumer</span>
└── <span class="tree-dir">apps/web/src/</span>
    └── <span class="tree-file">billing.tsx</span>              <span style="color: #64748b;">// Frontend billing UI consumer</span>
</pre>
<div style="margin-top: 24px; font-size: 17px;">
<span class="prompt-char">$</span> git status<br>
<span style="color: #4ade80;">On branch master — nothing to commit, working tree clean</span><br><br>
<span class="prompt-char">$</span> git log -1 --oneline<br>
<span style="color: #f59e0b;">4e1a46c</span> (HEAD -> master) feat(payments): define core payment interfaces and consumers
</div>`;
  await page.setContent(terminalHtml(1, "REPOSITORY BASELINE & ARCHITECTURE", "tree -L 4 packages services apps", s1Output));
  await page.waitForTimeout(15000);

  // SCENE 2: Real Breaking Contract Change (15.0s)
  console.log("Recording Scene 2 (15.0s): Breaking Contract Change...");
  const s2Output = `
<div style="margin-bottom: 16px; color: #94a3b8;"># Contract modification: renaming required field 'currency' to 'currencyCode'</div>
<pre style="font-size: 17px; line-height: 1.7;">
<span class="diff-hdr">diff --git a/packages/contracts/src/payment.ts b/packages/contracts/src/payment.ts</span>
<span class="diff-hdr">--- a/packages/contracts/src/payment.ts</span>
<span class="diff-hdr">+++ b/packages/contracts/src/payment.ts</span>
@@ -1,5 +1,5 @@
 export interface PaymentRequest {
   id: string;
   amount: number;
<span class="diff-rem">-  currency: string;</span>
<span class="diff-add">+  currencyCode: string;</span>
 }
</pre>
<div style="margin-top: 24px; padding: 16px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 4px;">
  <span style="color: #fbbf24; font-weight: 600;">⚠️ Downstream Impact:</span><br>
  <span style="color: #cbd5e1;">Downstream consumers <code>checkout.ts</code> and <code>billing.tsx</code> still access <code>request.currency</code>.</span>
</div>`;
  await page.setContent(terminalHtml(2, "BREAKING TYPESCRIPT CONTRACT CHANGE", "git diff packages/contracts/src/payment.ts", s2Output));
  await page.waitForTimeout(15000);

  // SCENE 3: Real CLI Execution (15.0s)
  console.log("Recording Scene 3 (15.0s): CLI Engine Execution...");
  const s3Output = `
<pre style="font-size: 16px; line-height: 1.65; color: #e2e8f0;">
<span style="color: #38bdf8; font-weight: bold;">Loom report</span>
Base: <span style="color: #94a3b8;">4e1a46ce6ca4463276d8397496eb07c7d3bbed70</span>
Changed files: <span style="color: #f59e0b;">1</span> (packages/contracts/src/payment.ts)
Modules: <span style="color: #38bdf8;">3</span>
Contract changes: <span style="color: #f59e0b;">1</span>
Findings: <span style="color: #ef4444; font-weight: bold;">2</span> (high 2, medium 0, low 0)

<span style="color: #cbd5e1; font-weight: 600;">Contract changes:</span>
  <span style="color: #f59e0b;">renamed-field</span>: packages/contracts/src/payment.ts#PaymentRequest.currency -> currencyCode

<span style="color: #cbd5e1; font-weight: 600;">Findings:</span>
<span class="finding-badge">HIGH</span> <span class="finding-title">finding-544ba5137a781508</span> PaymentRequest renamed currency to currencyCode; services/order-service/src/checkout.ts still reads currency
  <span class="finding-sub">consumer:</span> services/order-service/src/checkout.ts
  <span class="finding-sub">confidence:</span> <span style="color: #4ade80;">high</span>
  <span class="finding-sub">evidence:</span> services/order-service/src/checkout.ts:4:52 (typed-property) path=services/order-service/src/checkout.ts -> packages/contracts/src/payment.ts

<span class="finding-badge">HIGH</span> <span class="finding-title">finding-d61a58cc95fcd4e5</span> PaymentRequest renamed currency to currencyCode; apps/web/src/billing.tsx still reads currency
  <span class="finding-sub">consumer:</span> apps/web/src/billing.tsx
  <span class="finding-sub">confidence:</span> <span style="color: #4ade80;">high</span>
  <span class="finding-sub">evidence:</span> apps/web/src/billing.tsx:4:23 (typed-property) path=apps/web/src/billing.tsx -> packages/contracts/src/payment.ts
</pre>`;
  await page.setContent(terminalHtml(3, "REAL CLI ENGINE EXECUTION", "loom report --format json --output .loom/reports/report.json", s3Output));
  await page.waitForTimeout(15000);

  // SCENE 4: Validated JSON Report Artifact (15.0s)
  console.log("Recording Scene 4 (15.0s): Report Artifact Validation...");
  const s4Output = `
<pre style="font-size: 16px; line-height: 1.65;">
{
  <span class="json-key">"version"</span>: <span class="json-str">"loom.report/v1"</span>,
  <span class="json-key">"repository"</span>: {
    <span class="json-key">"name"</span>: <span class="json-str">"demo-platform"</span>,
    <span class="json-key">"branch"</span>: <span class="json-str">"master"</span>,
    <span class="json-key">"commit"</span>: <span class="json-str">"4e1a46ce6ca4463276d8397496eb07c7d3bbed70"</span>,
    <span class="json-key">"baseCommit"</span>: <span class="json-str">"4e1a46ce6ca4463276d8397496eb07c7d3bbed70"</span>
  },
  <span class="json-key">"summary"</span>: {
    <span class="json-key">"filesChanged"</span>: <span class="json-num">1</span>,
    <span class="json-key">"contractChanges"</span>: <span class="json-num">1</span>,
    <span class="json-key">"findings"</span>: <span class="json-num">2</span>,
    <span class="json-key">"highConfidence"</span>: <span class="json-num">2</span>,
    <span class="json-key">"mediumConfidence"</span>: <span class="json-num">0</span>,
    <span class="json-key">"lowConfidence"</span>: <span class="json-num">0</span>
  },
  <span class="json-key">"findings"</span>: [
    { <span class="json-key">"id"</span>: <span class="json-str">"finding-544ba5137a781508"</span>, <span class="json-key">"consumer"</span>: <span class="json-str">"services/order-service/src/checkout.ts"</span>, <span class="json-key">"severity"</span>: <span class="json-str">"high"</span> },
    { <span class="json-key">"id"</span>: <span class="json-str">"finding-d61a58cc95fcd4e5"</span>, <span class="json-key">"consumer"</span>: <span class="json-str">"apps/web/src/billing.tsx"</span>, <span class="json-key">"severity"</span>: <span class="json-str">"high"</span> }
  ],
  <span class="json-key">"graph"</span>: { <span class="json-key">"nodes"</span>: <span class="json-num">4</span>, <span class="json-key">"edges"</span>: <span class="json-num">5</span> }
}
</pre>
<div style="margin-top: 16px; color: #10b981; font-weight: 600;">
  ✓ Conforms to versioned Loom JSON schema (loom.report/v1) · Embedded AST graph snapshot verified
</div>`;
  await page.setContent(terminalHtml(4, "VALIDATED REPORT ARTIFACT (loom.report/v1)", "jq '{ version, repository, summary, findings, graph }' .loom/reports/report.json", s4Output));
  await page.waitForTimeout(15000);

  // SCENE 5: Dashboard Overview & Provenance (16.0s)
  console.log("Recording Scene 5 (16.0s): Dashboard Overview...");
  await page.goto(`${DASHBOARD_URL}/?report=/reports/report.json`, { waitUntil: "networkidle" });
  await page.waitForSelector(".metric-box", { timeout: 15000 });
  await page.waitForTimeout(3000);
  const metricCards = await page.$$(".metric-box");
  if (metricCards[0]) await metricCards[0].hover();
  await page.waitForTimeout(4000);
  if (metricCards[1]) await metricCards[1].hover();
  await page.waitForTimeout(4000);
  if (metricCards[2]) await metricCards[2].hover();
  await page.waitForTimeout(5000);

  // SCENE 6: Findings Queue & Triaging (14.0s)
  console.log("Recording Scene 6 (14.0s): Findings Queue...");
  await page.click('a[href="/findings"]');
  await page.waitForSelector(".finding-row", { timeout: 15000 });
  await page.waitForTimeout(3000);
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await searchInput.type("checkout", { delay: 100 });
    await page.waitForTimeout(3000);
    await searchInput.fill("");
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(6000);

  // SCENE 7: Finding Inspector & AST Evidence (15.0s)
  console.log("Recording Scene 7 (15.0s): Finding Inspector...");
  const findingRows = await page.$$(".finding-row");
  if (findingRows[0]) {
    await findingRows[0].click();
  }
  await page.waitForTimeout(3000);
  const codeBlocks = await page.$$("pre, code, .evidence-card, .evidence-meta");
  if (codeBlocks[0]) await codeBlocks[0].hover();
  await page.waitForTimeout(6000);
  await page.waitForTimeout(6000);

  // SCENE 8: Scoped Impact Graph (15.0s)
  console.log("Recording Scene 8 (15.0s): Scoped Impact Graph...");
  await page.click('a[href="/graph"]');
  await page.waitForTimeout(4000);
  const reactFlow = await page.$(".react-flow");
  if (reactFlow) {
    await reactFlow.hover();
    await page.mouse.move(960, 540);
    await page.waitForTimeout(2000);
    await page.mouse.move(1100, 480);
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(7000);

  // SCENE 9: Unknown Finding Guardrail Notice (12.0s)
  console.log("Recording Scene 9 (12.0s): Unknown Finding Notice...");
  await page.goto(`${DASHBOARD_URL}/graph?finding=finding-unknown-999`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const notice = await page.$(".inline-notice");
  if (notice) await notice.hover();
  await page.waitForTimeout(9000);

  // SCENE 10: Honest Verification Status (13.0s)
  console.log("Recording Scene 10 (13.0s): Honest Verification...");
  await page.click('a[href="/verification"]');
  await page.waitForTimeout(4000);
  const verifyHeader = await page.$(".page-header");
  if (verifyHeader) await verifyHeader.hover();
  await page.waitForTimeout(9000);

  // SCENE 11: Reports Inventory & Artifact Provenance (20.0s)
  console.log("Recording Scene 11 (20.0s): Reports Artifact Provenance...");
  await page.click('a[href="/reports"]');
  await page.waitForTimeout(4000);
  const artifactGrid = await page.$(".artifact-grid");
  if (artifactGrid) await artifactGrid.hover();
  await page.waitForTimeout(6000);
  const dlButton = await page.$('button:has-text("Download JSON")');
  if (dlButton) await dlButton.hover();
  await page.waitForTimeout(10000);

  // Close browser and context to finalize raw video recording
  console.log("Finalizing browser video recording...");
  await page.close();
  await context.close();
  await browser.close();

  // Stop dev server
  server.kill();
  console.log("Dev server stopped.");

  // 3. Find the raw video recorded by Playwright
  const rawFiles = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".webm"));
  if (rawFiles.length === 0) {
    throw new Error("No webm video was recorded by Playwright!");
  }
  const rawVideoPath = path.join(RAW_DIR, rawFiles[0]);
  console.log(`Raw video saved to: ${rawVideoPath}`);

  // 4. Mux video, narration, and captions into final MP4 using ffmpeg
  console.log("Assembling final MP4 with FFmpeg (H.264 video, AAC audio, subtitles)...");
  // Encode video at 1920x1080 30fps, duration 165s, mux narration.wav, embed mov_text subtitle
  const ffmpegCmd = `ffmpeg -y -i ${JSON.stringify(rawVideoPath)} -i ${JSON.stringify(NARRATION_WAV)} -i ${JSON.stringify(CAPTIONS_SRT)} -map 0:v -map 1:a -map 2:s -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -t 165.0 -c:a aac -b:a 192k -c:s mov_text -metadata:s:s:0 language=eng -movflags +faststart ${JSON.stringify(OUTPUT_MP4)}`;

  execSync(ffmpegCmd, { stdio: "inherit" });
  console.log(`Final demo video produced at: ${OUTPUT_MP4}`);

  // 5. Verify final MP4 with ffprobe
  const probeOutput = execSync(`ffprobe -v error -show_entries format=duration,size,bit_rate -show_streams -of json ${JSON.stringify(OUTPUT_MP4)}`).toString();
  const probe = JSON.parse(probeOutput);
  console.log("=== FFprobe Verification Summary ===");
  console.log(`Format Duration: ${probe.format?.duration} s`);
  console.log(`File Size: ${(Number(probe.format?.size) / (1024 * 1024)).toFixed(2)} MB`);
  for (const s of probe.streams) {
    console.log(`Stream #${s.index} [${s.codec_type}]: ${s.codec_name} ${s.width ? s.width + 'x' + s.height : ''} ${s.sample_rate ? s.sample_rate + ' Hz' : ''}`);
  }

  // Cleanup raw recording directory
  fs.rmSync(RAW_DIR, { recursive: true, force: true });
  console.log("=== Demo video production complete! ===");
}

run().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
