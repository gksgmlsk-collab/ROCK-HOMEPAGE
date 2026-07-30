# DOL AI LAB video prompts

These prompts prepare the five scene clips and four frame-locked transitions for the
Scroll World timeline. They do not invoke Higgsfield or spend credits.

## Render order

1. Render all five files in `desktop/scenes` with the source image and character
   references listed in `manifest.json`.
2. Normalize the scene clips, then extract their exact first and last rendered frames.
3. Render each file in `desktop/transitions` with the preceding scene's actual last
   frame as `start_image` and the following scene's actual first frame as `end_image`.
4. Native portrait generation is currently stopped by user request. Do not submit the
   remaining files in `mobile/scenes` or any `mobile/transitions`, and do not build a
   portrait master. The three already-completed zero-credit portrait scenes are raw
   archive material only.

Do not use the original scene still as a transition boundary. A transition always uses
actual neighboring video frames. Do not mix video models inside one chain.

The intended model is `seedance_2_0` with audio disabled. If generation is ever resumed,
re-check the live Higgsfield schema and exact configuration cost immediately before
every submission; submit only when that cost is `0` credits. `manifest.json` is planning
metadata, not an executable generation script.
