import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const scenes = [
  {
    id: 1,
    duration: 15.0,
    text: "Welcome to Loom, an open-source, local-first developer tool for change-impact intelligence. Loom analyzes TypeScript abstract syntax trees and Git history to determine precisely what breaks before you ship.",
  },
  {
    id: 2,
    duration: 15.0,
    text: "In our payment platform repository, an engineer updates the core PaymentRequest contract, removing the required currency field. Downstream services and frontend billing components still depend on this field.",
  },
  {
    id: 3,
    duration: 15.0,
    text: "We run Loom's CLI using loom report. Loom's deterministic engine inspects Git diffs, parses TypeScript contracts via the compiler API, and traces consumers across imports without executing untrusted code.",
  },
  {
    id: 4,
    duration: 15.0,
    text: "The generated report adheres strictly to the versioned loom.report/v1 schema, embedding stable finding IDs, syntax evidence, confidence scores, and dependency edges. No synthetic data, no placeholders.",
  },
  {
    id: 5,
    duration: 16.0,
    text: "We launch the Loom dashboard. It connects directly to our local report artifact. The Overview displays verified metrics: two breaking findings, high confidence, and full provenance linking back to the active repository.",
  },
  {
    id: 6,
    duration: 14.0,
    text: "Navigating to the Findings Queue, engineers can triage breaking changes. Each finding clearly communicates its root cause, severity, and consumer modules, eliminating noise from unimpacted files.",
  },
  {
    id: 7,
    duration: 15.0,
    text: "Opening the finding detail reveals deep AST evidence. Loom highlights the exact source location in checkout.ts where currency is accessed, along with the precise import path back to payment.ts.",
  },
  {
    id: 8,
    duration: 15.0,
    text: "The Impact Graph renders a visual dependency map scoped specifically to the affected contract. We can inspect upstream origins, downstream consumers, and verify transitive relationships at a glance.",
  },
  {
    id: 9,
    duration: 12.0,
    text: "Loom handles direct links and stale URLs gracefully. If a finding ID does not exist in the report, an honest warning informs the user while safely presenting the workspace graph without crashing.",
  },
  {
    id: 10,
    duration: 13.0,
    text: "The Verification view enforces transparency. Because no automated verification scripts were configured in loom config, it honestly reports Not run, never fabricating artificial pass marks or mock test results.",
  },
  {
    id: 11,
    duration: 20.0,
    text: "Finally, the Reports page inspects artifact provenance and schema compliance. Loom is deterministic, fast, and entirely local-first, empowering teams to refactor TypeScript codebases with absolute confidence.",
  },
];

const outDir = path.resolve("artifacts/demo-video");
const tmpDir = path.resolve("artifacts/demo-video/tmp_audio");
fs.mkdirSync(tmpDir, { recursive: true });

const sceneFiles = [];

for (const scene of scenes) {
  const rawWav = path.join(tmpDir, `scene_${scene.id}_raw.wav`);
  const paddedWav = path.join(tmpDir, `scene_${scene.id}_padded.wav`);

  console.log(`Generating narration for Scene ${scene.id} (${scene.duration}s)...`);
  // Generate with espeak-ng: en-us, 145 wpm, calm pitch 48
  execSync(`espeak-ng -v en-us -s 145 -p 48 ${JSON.stringify(scene.text)} -w ${JSON.stringify(rawWav)}`);

  // Pad and master audio with ffmpeg: lead silence 0.5s, master EQ, pad to exact target duration
  execSync(
    `ffmpeg -y -i ${JSON.stringify(rawWav)} -af "adelay=500|500,highpass=f=120,lowpass=f=3800,volume=1.4,apad" -t ${scene.duration} -ar 44100 -ac 2 ${JSON.stringify(paddedWav)} 2>/dev/null`
  );

  sceneFiles.push(`file '${paddedWav}'`);
}

// Write concat file
const concatListFile = path.join(tmpDir, "concat_list.txt");
fs.writeFileSync(concatListFile, sceneFiles.join("\n"));

const finalWav = path.join(outDir, "narration.wav");
console.log(`Concatenating all scenes into ${finalWav}...`);
execSync(`ffmpeg -y -f concat -safe 0 -i ${JSON.stringify(concatListFile)} -c:a pcm_s16le ${JSON.stringify(finalWav)} 2>/dev/null`);

// Verify final duration
const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${JSON.stringify(finalWav)}`).toString().trim();
console.log(`Final narration created: duration = ${dur} seconds (target: 165s)`);

// Cleanup tmpDir
fs.rmSync(tmpDir, { recursive: true, force: true });
