# Higgsfield generation record

This project uses Higgsfield Seedance 2.0 in reference-driven standard mode:

- desktop: native 16:9, 1080p, high bitrate
- scenes: 5 seconds each
- frame-locked transitions: 4 seconds each
- audio: disabled

Every submitted job used `use_unlim: true`. Its exact configuration was preflighted at
`0` credits, and the workspace balance remained at the original 10 credits; there is
no automatic paid fallback. Human scenes 01 and 02 use the active motion-enhanced
renders recorded in `jobs.json`: restrained asynchronous blinks, tiny hand or shoulder
movement, and DOLBOT eye or wave motion, with face, hand, and identity locks. Scene 05
uses only the user-supplied `scene5_services.png` in a local camera edit, so no generated
Korean or redrawn application screen appears in the active master.

The final read-only account check reported the Plus plan and 10 credits. The free trial
is active until `2026-07-31T06:00:52Z`, but its current
`unlimitedAvailable` flag is `false`. No further generation is authorized by this
record; any future job must pass a fresh exact zero-credit estimate.

Native portrait generation was stopped at the user's request. Three already-completed
zero-credit portrait scenes are retained only under `raw/` as an archive. Scenes 04–05
and all portrait transitions were not submitted, and no mobile master is built. The
frontend uses the desktop master with `contain`, plus the existing portrait poster
canvases in the stable artwork bands, so it does not crop the composition.

## Continuity law

Each scene begins on its approved source artwork. After the five scene renders are
normalized, the exact first and last decoded frames are extracted under:

```text
public/generated/frames/{desktop|mobile}/scenes/
```

Each transition receives the preceding scene's actual last frame as `start_image` and
the following scene's actual first frame as `end_image`. Transition 04→05 is a local
crossfade to the supplied Scene 05 artwork because the historic generated clip contained
synthetic Korean from its first frame.

Because generative endpoint conditioning can remain visually close without decoding to
identical pixels, the derived normalized transition receives an eight-frame local
endpoint blend before master assembly. This costs no credits, preserves the generated
interior camera flight, and makes the first/last decoded frames match their actual
neighbors. Raw downloads and generation renders remain untouched.

Recurring teachers and DOLBOT use the completed Higgsfield reusable Elements recorded
in the prompt files. DOLSOE remains a distinct glossy black humanoid and is never
substituted with DOLBOT.

## Reproduction

The canonical prompt set and media map are in
[`prompts/manifest.json`](prompts/manifest.json). Completed job IDs, active motion
variants, mobile stop state, reusable Elements, and observed zero-credit billing are
recorded in [`jobs.json`](jobs.json).
Downloaded source renders are retained under `raw/`, and the exact filenames consumed by
the local media pipeline are under `renders/`. See
[`../scripts/media/README.md`](../scripts/media/README.md) for normalization, master
assembly, seam checks, duration checks, and short-GOP validation.
