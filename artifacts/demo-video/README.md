# Loom Product Demonstration Video

This directory contains the production product demonstration for **Loom**, an open-source, local-first developer tool for TypeScript change-impact intelligence.

## Artifacts in this Directory

- **`loom-demo.mp4`**: Final production video with **burned-in synchronized subtitles** (1920x1080 16:9, 30 fps, H.264 video via `libopenh264`, AAC audio, 2m 45s).
- **`loom-demo-clean.mp4`**: Clean production video without burned-in captions, providing the clean video stream, AAC audio, and embedded soft `mov_text` subtitle track.
- **`captions.srt`**: SubRip format subtitles with accurate sentence-level timestamps synchronized with speech.
- **`captions.vtt`**: WebVTT format subtitles for HTML5 video web playback.
- **`narration.wav`**: Mastered narration audio track (44.1 kHz, stereo, EBU R128 normalized to -16.2 LUFS and -1.0 dBTP true peak).
- **`script.md`**: Complete 11-scene walkthrough script with scene breakdown and timecodes.
- **`README.md`**: This guide describing the demonstration and reproduction instructions.
- **`backup_original/`**: Preserved backup of original initial demo media assets.

---

## Video & Audio Specifications

| Metric | Specification |
| :--- | :--- |
| **Duration** | 2 minutes 45 seconds (165.0 seconds) |
| **Resolution** | 1920 x 1080 (1080p Full HD) |
| **Aspect Ratio** | 16:9 widescreen |
| **Frame Rate** | 30.0 fps progressive |
| **Video Codec** | H.264 / AVC (`libopenh264`, `avc1.42c028`) |
| **Audio Codec** | AAC-LC (`mp4a.40.2`), 44.1 kHz, 171–192 kb/s, stereo |
| **Voice Profile** | `en-US-AndrewMultilingualNeural` (Warm, Confident, Authentic Engineering tone) |
| **Integrated Loudness** | -16.2 LUFS (Target: -16 LUFS) |
| **True Peak** | -1.0 dBTP (Target: ≤ -1.0 dBTP) |
| **Loudness Range** | 4.2 LU |
| **Subtitle Styling** | Liberation Sans 20pt, white `#FFFFFF`, semi-transparent dark box background `#900B0F19`, 32px bottom safe margin |
| **File Sizes** | `loom-demo.mp4`: ~6.4 MB · `loom-demo-clean.mp4`: ~4.8 MB |

---

## 11-Scene Walkthrough Summary

1. **Scene 1: Introduction and Repository Baseline (0:00 – 0:15)**
   - Explores the `demo-platform` multi-module TypeScript workspace on clean commit `4e1a46c`.
   - Outlines the architecture across `packages/contracts`, `services/order-service`, and `apps/web`.
2. **Scene 2: Real Breaking Contract Change (0:15 – 0:30)**
   - Shows the TypeScript contract diff removing the required field `currency` and adding `currencyCode` in `PaymentRequest`.
   - Explains that downstream consumers still read `.currency`.
3. **Scene 3: Real CLI Engine Execution (0:30 – 0:45)**
   - Runs `loom report --format json --output .loom/reports/report.json`.
   - Shows live stdout analysis: 1 changed file, 3 modules, 1 contract change, and 2 high-confidence breaking findings with exact impact paths.
4. **Scene 4: Validated JSON Report Artifact (0:45 – 1:00)**
   - Inspects `.loom/reports/report.json` confirming compliance with `loom.report/v1`, embedded dependency graph nodes and edges.
5. **Scene 5: Dashboard Overview & Provenance (1:00 – 1:16)**
   - Launches the Loom Dashboard connected to the real report.
   - Shows live metrics: 2 breaking findings, 0 uncertainty, 1 changed file, repository name, and active workspace provenance.
6. **Scene 6: Findings Queue & Triaging (1:16 – 1:30)**
   - Navigates to `/findings`.
   - Explores high-severity badges, impact paths, and interactive search filtering.
7. **Scene 7: Finding Inspector & AST Evidence (1:30 – 1:45)**
   - Opens the finding inspector for `services/order-service/src/checkout.ts`.
   - Highlights source line 4 reading `request.currency`, AST node `typed-property`, and import trace.
8. **Scene 8: Scoped Impact Graph (1:45 – 2:00)**
   - Navigates to the React Flow `/graph` scoped to the finding.
   - Panning and zooming across contract nodes and consumer modules.
9. **Scene 9: Unknown Finding Guardrail Notice (2:00 – 2:12)**
   - Navigates directly to `/graph?finding=finding-unknown-999`.
   - Demonstrates the non-blocking warning notice without crashing or displaying fake data.
10. **Scene 10: Honest Verification Status (2:12 – 2:25)**
    - Navigates to `/verification`.
    - Shows the transparent status "Checks not run / 0 checks recorded" when verification commands are unconfigured.
11. **Scene 11: Reports Inventory & Artifact Provenance (2:25 – 2:45)**
    - Navigates to `/reports`.
    - Reviews artifact provenance, schema version, download JSON capability, and module inventory.

---

## Reproduction Instructions

To regenerate all audio, subtitle, and video assets:

```bash
# 1. Synthesize natural neural voice audio, compute synchronized subtitles, and render MP4s
.venv_audio/bin/python scripts/produce_perfect_audio_and_captions.py

# 2. Verify media stream health and loudness standards
ffprobe -v error -show_entries format=filename,duration,size -show_streams -of json artifacts/demo-video/loom-demo.mp4
ffmpeg -i artifacts/demo-video/narration.wav -af "ebur128" -f null -
```
