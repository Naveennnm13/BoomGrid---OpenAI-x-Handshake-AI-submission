# Recovery record
Recovered November 6, 2026.

## Complete recovery
All 135 tracked files were recovered from Sites commit 8c9efd4824f5562ea00d696461f01167441f7ee0. Eight saved documents/assets were recovered separately. Hosting project identity was removed from .openai/hosting.json. No credentials, environment files, player database, dependencies, or caches are included.

## Later Vercel source
The later production deployment is dpl_6yjnaccRVURrSngmDuVUSCugDHaD. Nine source paths differ from the Sites snapshot. File export truncated five:
- app/game.css
- app/page.tsx
- components/ui/game-grid.tsx
- components/ui/game-tutorial.tsx
- package.json

These five newer files are NOT recovered. Their older versions remain in the root snapshot. No truncated data was substituted.

Four intact newer files were recovered and checked against deployment SHA-1 hashes: .gitignore, app/api/game/route.ts, components/ui/power-lights.tsx, vercel.json. They are in recovery/vercel-partial/, which is not a standalone application.

## Verification limits
All 31 tests passed using node --experimental-strip-types --test tests/*.test.mjs. Fresh dependency installation was attempted but did not complete during recovery. Typecheck, production compilation, and browser/mobile QA were not rerun successfully. The prior production-build ZIP was not recovered. This is a source recovery, not a compiled release.

Original documentation may describe simultaneous firing. Current newRoom defaults to turn-based play; tests cover legacy engine behavior and current turn sequencing.

## GitHub
Destination: Naveennnm13/BoomGrid---OpenAI-x-Handshake-AI-submission.
Repository write access was verified on November 6, 2026. The initial permission failure was resolved before this import.

## Next step
Obtain a full export of the later Vercel source to recover the five missing newer files. Preserve this recovered source until that export is verified.
