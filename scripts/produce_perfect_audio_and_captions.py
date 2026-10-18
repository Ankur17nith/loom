import asyncio
import os
import subprocess
import time
import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"
RATE = "+5%"

SCENES = [
    {
        "id": 1,
        "name": "Repository Baseline & Architecture",
        "start": 0.0,
        "duration": 15.0,
        "sentences": [
            "Welcome to Loom, an open-source, local-first developer tool for change-impact intelligence.",
            "Loom analyzes TypeScript abstract syntax trees and Git history to determine precisely what breaks before you ship.",
        ],
    },
    {
        "id": 2,
        "name": "Breaking TypeScript Contract Change",
        "start": 15.0,
        "duration": 15.0,
        "sentences": [
            "In our payment platform repository, an engineer updates the core PaymentRequest contract, removing the required currency field.",
            "Downstream services and frontend billing components still depend on this field.",
        ],
    },
    {
        "id": 3,
        "name": "Real CLI Engine Execution",
        "start": 30.0,
        "duration": 15.0,
        "sentences": [
            "We run Loom's CLI using loom report.",
            "Loom's deterministic engine inspects Git diffs, parses TypeScript contracts, and traces consumers across imports without executing untrusted code.",
        ],
    },
    {
        "id": 4,
        "name": "Validated Report Artifact (loom.report/v1)",
        "start": 45.0,
        "duration": 15.0,
        "sentences": [
            "The generated report conforms to the versioned loom.report/v1 schema, embedding stable finding IDs, syntax evidence, and confidence scores.",
            "No synthetic data, no placeholders.",
        ],
    },
    {
        "id": 5,
        "name": "Dashboard Overview & Provenance",
        "start": 60.0,
        "duration": 16.0,
        "sentences": [
            "We launch the Loom dashboard, connecting directly to our local report artifact.",
            "The Overview displays verified metrics: two breaking findings, high confidence, and full provenance linking back to the active repository.",
        ],
    },
    {
        "id": 6,
        "name": "Findings Queue & Triaging",
        "start": 76.0,
        "duration": 14.0,
        "sentences": [
            "Navigating to the Findings Queue, engineers can triage breaking changes.",
            "Each finding clearly communicates its root cause, severity, and consumer modules, eliminating noise from unimpacted files.",
        ],
    },
    {
        "id": 7,
        "name": "Finding Inspector & AST Evidence",
        "start": 90.0,
        "duration": 15.0,
        "sentences": [
            "Opening the finding detail reveals deep AST evidence.",
            "Loom highlights the exact source location in checkout.ts where currency is accessed, along with the precise import path back to payment.ts.",
        ],
    },
    {
        "id": 8,
        "name": "Scoped Impact Graph",
        "start": 105.0,
        "duration": 15.0,
        "sentences": [
            "The Impact Graph renders a visual dependency map scoped specifically to the affected contract.",
            "We can inspect upstream origins, downstream consumers, and verify transitive relationships at a glance.",
        ],
    },
    {
        "id": 9,
        "name": "Unknown Finding Guardrail Notice",
        "start": 120.0,
        "duration": 12.0,
        "sentences": [
            "Loom handles direct links and stale URLs gracefully.",
            "If a finding ID does not exist in the report, an honest warning informs the user while safely presenting the workspace graph.",
        ],
    },
    {
        "id": 10,
        "name": "Honest Verification Status",
        "start": 132.0,
        "duration": 13.0,
        "sentences": [
            "The Verification view enforces transparency.",
            "Because no verification scripts were configured in loom config, it honestly reports Not run—never fabricating artificial pass marks.",
        ],
    },
    {
        "id": 11,
        "name": "Reports Inventory & Artifact Provenance",
        "start": 145.0,
        "duration": 20.0,
        "sentences": [
            "Finally, the Reports page inspects artifact provenance and schema compliance.",
            "Loom is deterministic, fast, and entirely local-first—empowering teams to refactor TypeScript codebases with absolute confidence.",
        ],
    },
]

TMP_DIR = "artifacts/demo-video/tmp_neural_audio"
os.makedirs(TMP_DIR, exist_ok=True)

def get_audio_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    out = subprocess.check_output(cmd).decode().strip()
    return float(out)

def format_timestamp_srt(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def format_timestamp_vtt(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

async def generate_speech_with_retry(text, output_file, max_retries=4):
    for attempt in range(max_retries):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            await comm.save(output_file)
            return
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            backoff = 2.0 * (attempt + 1)
            print(f"    [Retry {attempt+1}/{max_retries} in {backoff:.1f}s due to: {e}]")
            await asyncio.sleep(backoff)

async def main():
    print(f"=== Synthesizing Natural Human Voice with {VOICE} (rate: {RATE}) ===")
    
    caption_segments = []
    audio_clips = []
    
    clip_idx = 0
    for scene in SCENES:
        scene_start = scene["start"]
        scene_dur = scene["duration"]
        scene_end = scene_start + scene_dur
        print(f"\n--- Scene {scene['id']}: {scene['name']} [{scene_start:.1f}s – {scene_end:.1f}s] ({scene_dur:.1f}s) ---")
        
        # In each scene, first sentence starts 0.5s after scene starts
        current_cursor = scene_start + 0.5
        
        for sent_text in scene["sentences"]:
            clip_idx += 1
            raw_mp3 = os.path.join(TMP_DIR, f"clip_{clip_idx:02d}.mp3")
            raw_wav = os.path.join(TMP_DIR, f"clip_{clip_idx:02d}.wav")
            
            await generate_speech_with_retry(sent_text, raw_mp3)
            # Sleep 1.2s to prevent endpoint rate limits
            await asyncio.sleep(1.2)
            
            # Convert to uncompressed 44.1kHz stereo WAV
            subprocess.run([
                "ffmpeg", "-y", "-i", raw_mp3,
                "-ar", "44100", "-ac", "2",
                raw_wav
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            dur = get_audio_duration(raw_wav)
            clip_start = current_cursor
            clip_end = clip_start + dur
            
            # Subtitle display extends slightly past speech end for readability
            sub_end = min(clip_end + 0.25, scene_end - 0.2)
            
            print(f"  Sentence {clip_idx:02d} [{clip_start:5.2f}s -> {clip_end:5.2f}s] (dur: {dur:4.2f}s): {sent_text}")
            
            audio_clips.append({
                "file": raw_wav,
                "start": clip_start,
                "duration": dur,
                "end": clip_end,
                "text": sent_text
            })
            
            caption_segments.append({
                "id": clip_idx,
                "start": clip_start,
                "end": sub_end,
                "text": sent_text
            })
            
            # Advance cursor with a natural 0.35s conversational breath pause
            current_cursor = clip_end + 0.35

        # Check remaining scene breathing room
        remaining = scene_end - current_cursor
        print(f"  Scene {scene['id']} concludes with {remaining:.2f}s clean transition breathing room.")

    print("\n=== Mixing and Normalizing Narration Track (Target -16 LUFS, -1 dBTP) ===")
    
    # Build filter complex with precise millisecond adelay for each clip
    filter_inputs = []
    filter_delays = []
    for i, clip in enumerate(audio_clips):
        delay_ms = int(round(clip["start"] * 1000))
        filter_inputs.extend(["-i", clip["file"]])
        filter_delays.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
    
    mix_inputs = "".join(f"[a{i}]" for i in range(len(audio_clips)))
    filter_str = (
        f"{';'.join(filter_delays)};"
        f"{mix_inputs}amix=inputs={len(audio_clips)}:normalize=0[mixed];"
        f"[mixed]highpass=f=80,lowpass=f=12000,loudnorm=I=-16:TP=-1.0:LRA=11[norm]"
    )
    
    output_wav = "artifacts/demo-video/narration.wav"
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        *filter_inputs,
        "-filter_complex", filter_str,
        "-map", "[norm]",
        "-t", "165.0",
        "-ar", "44100",
        "-ac", "2",
        output_wav
    ]
    
    subprocess.run(ffmpeg_cmd, check=True)
    print(f"Mastered narration saved to {output_wav}")
    
    # Verify loudness of narration.wav
    loudness_check = subprocess.run([
        "ffmpeg", "-i", output_wav,
        "-af", "ebur128=framelog=verbose",
        "-f", "null", "-"
    ], stderr=subprocess.PIPE, text=True)
    
    for line in loudness_check.stderr.splitlines():
        if "Integrated loudness:" in line or "True peak:" in line or "Loudness range:" in line:
            print("  " + line.strip())

    # Write captions.srt
    print("\n=== Generating Subtitle Files (SRT and WebVTT) ===")
    srt_lines = []
    for seg in caption_segments:
        srt_lines.append(f"{seg['id']}")
        srt_lines.append(f"{format_timestamp_srt(seg['start'])} --> {format_timestamp_srt(seg['end'])}")
        srt_lines.append(seg["text"])
        srt_lines.append("")
    
    srt_path = "artifacts/demo-video/captions.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    print(f"Saved {srt_path}")

    # Write captions.vtt
    vtt_lines = ["WEBVTT", ""]
    for seg in caption_segments:
        vtt_lines.append(f"{seg['id']}")
        vtt_lines.append(f"{format_timestamp_vtt(seg['start'])} --> {format_timestamp_vtt(seg['end'])}")
        vtt_lines.append(seg["text"])
        vtt_lines.append("")
    
    vtt_path = "artifacts/demo-video/captions.vtt"
    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(vtt_lines))
    print(f"Saved {vtt_path}")

    # Render video files
    # Source video: artifacts/demo-video/backup_original/loom-demo.mp4 (video stream)
    # 1. artifacts/demo-video/loom-demo.mp4 with burned-in subtitles
    # 2. artifacts/demo-video/loom-demo-clean.mp4 without burned-in subtitles (clean version)
    source_video = "artifacts/demo-video/backup_original/loom-demo.mp4"
    
    print("\n=== Rendering Deliverable 1: loom-demo.mp4 (with Burned-in Subtitles) ===")
    # Subtitle style: Liberation Sans, FontSize=20, white text, subtle semi-transparent box background, safe margin 32px from bottom
    sub_style = "FontName=Liberation Sans,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H900B0F19,BorderStyle=4,Outline=1,Shadow=0,MarginV=32,Alignment=2"
    
    burned_mp4 = "artifacts/demo-video/loom-demo.mp4"
    burned_cmd = [
        "ffmpeg", "-y",
        "-i", source_video,
        "-i", output_wav,
        "-filter_complex", f"[0:v]subtitles={srt_path}:force_style='{sub_style}'[vburn]",
        "-map", "[vburn]",
        "-map", "1:a",
        "-c:v", "libopenh264",
        "-b:v", "2800k",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-t", "165.0",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        burned_mp4
    ]
    subprocess.run(burned_cmd, check=True)
    print(f"Rendered {burned_mp4}")

    print("\n=== Rendering Deliverable 2: loom-demo-clean.mp4 (Clean Video + Soft Subtitle Track) ===")
    clean_mp4 = "artifacts/demo-video/loom-demo-clean.mp4"
    clean_cmd = [
        "ffmpeg", "-y",
        "-i", source_video,
        "-i", output_wav,
        "-i", srt_path,
        "-map", "0:v",
        "-map", "1:a",
        "-map", "2:s",
        "-c:v", "libopenh264",
        "-b:v", "2800k",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-t", "165.0",
        "-c:a", "aac",
        "-b:a", "192k",
        "-c:s", "mov_text",
        "-metadata:s:s:0", "language=eng",
        "-movflags", "+faststart",
        clean_mp4
    ]
    subprocess.run(clean_cmd, check=True)
    print(f"Rendered {clean_mp4}")

    # Cleanup temporary clips
    for f in os.listdir(TMP_DIR):
        os.remove(os.path.join(TMP_DIR, f))
    os.rmdir(TMP_DIR)
    print("\n=== All audio, caption, and video deliverables completed successfully! ===")

if __name__ == "__main__":
    asyncio.run(main())
