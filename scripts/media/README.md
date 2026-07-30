# Local media pipeline

These PowerShell scripts only process local files. They never call Higgsfield, start a
generation, or spend credits.

## Tool discovery

The scripts locate tools in this order:

1. `FFMPEG_PATH` / `FFPROBE_PATH`
2. `ffmpeg` / `ffprobe` on `PATH`
3. local `node_modules/ffmpeg-static` and `node_modules/ffprobe-static` layouts

No dependency is added to `package.json` by these scripts.

## Incoming render layout

Download completed Higgsfield files using these exact stems:

```text
generation/renders/
  desktop/
    scenes/
      scene01_dol_ai_lab.mp4
      scene02_draconis.mp4
      scene03_data_map.mp4
      scene04_dolsoe.mp4
      scene05_services.mp4
    transitions/
      transition_01_to_02.mp4
      transition_02_to_03.mp4
      transition_03_to_04.mp4
      transition_04_to_05.mp4
  mobile/                         # only for a native no-cost 9:16 chain
    scenes/                       # same scene stems
    transitions/                  # same transition stems
```

`.mov`, `.webm`, `.mkv`, and `.m4v` inputs are also accepted. A missing clip causes a
clear terminating error; placeholder or fake media is never generated.

The mobile input is probed before encoding and must already be portrait
(`width < height`). The pipeline deliberately rejects a landscape file passed as mobile,
so a desktop center crop can never be shipped silently.

## Staged workflow

Create native portrait seed canvases before a mobile generation:

```powershell
.\scripts\media\New-PortraitCanvases.ps1
```

Hand-composed portrait canvases may be placed under
`public/generated/frames/mobile/canvases` using the
`scene01_dol_ai_lab_canvas.png` through `scene05_services_canvas.png` stems.
`Invoke-MediaPipeline.ps1 -IncludeMobile` only creates missing canvas files. It preserves
every existing canvas even when the final pipeline is run with `-Force`, and it places
missing canvases under the selected `-GeneratedRoot`.

After downloading the five desktop scene renders, normalize those files temporarily in
the expected render tree and extract scene boundary frames:

```powershell
.\scripts\media\Normalize-Media.ps1 -MediaKind Scenes
.\scripts\media\Extract-BoundaryFrames.ps1 -Variant Desktop -MediaKind Scenes
```

Use the exact `*_last.png` and following `*_first.png` files under
`public/generated/frames/desktop/scenes` as transition endpoints.

After rendering and downloading the four transitions, they can be normalized separately.
The local endpoint lock then blends only the first and last eight frames toward the
actual adjacent scene boundaries. It does not call a model, change the camera route, or
add a cut; it gives the decoded master pixel-locked hand-offs without spending credits:

```powershell
.\scripts\media\Normalize-Media.ps1 -MediaKind Transitions
.\scripts\media\Lock-TransitionEndpoints.ps1 -Variant Desktop
.\scripts\media\Extract-BoundaryFrames.ps1 -Variant Desktop -MediaKind Transitions
```

After all nine desktop renders have been downloaded:

```powershell
.\scripts\media\Invoke-MediaPipeline.ps1
```

Include a separately generated native portrait chain only when Higgsfield confirms it is
covered by the user's no-cost plan:

```powershell
.\scripts\media\Invoke-MediaPipeline.ps1 -IncludeMobile
```

Use `-Force` for the final assembly whenever any downloaded scene or transition render
has changed. Without it, existing normalized clips, extracted boundaries, endings, and
masters are intentionally retained. `-Force` rebuilds those derived files but never
overwrites an existing portrait seed canvas. Endpoint-locked clips carry an idempotency
marker, so a normal rerun does not compound the blend. A forced full pipeline first
normalizes from the preserved render, then reapplies one clean endpoint lock.

The final QA checks the expected scene duration (approximately 5 seconds), transition
duration (approximately 4 seconds), master duration (approximately 44 seconds), seam
similarity against the adjacent decoded frames, and a dense per-variant keyframe interval
suitable for scroll seeking. Both the H.264 and VP9 masters use the same short GOP target:
8 frames on desktop and 4 frames on mobile.

The final outputs are:

```text
public/generated/
  scenes/
  transitions/
  frames/
  master/
    dol-ai-lab-scroll.mp4
    dol-ai-lab-scroll.webm
    dol-ai-lab-scroll-mobile.mp4   # mobile flag only
    dol-ai-lab-scroll-mobile.webm  # mobile flag only
    media-qa.json
```

The master builder removes the one duplicated boundary frame from each subsequent clip,
keeps every individual normalized file intact, and creates a local three-second ending
that starts on Scene 5's exact last frame before revealing the supplied transparent
DOL AI LAB logo. Website copy remains HTML and is not burned into video.
