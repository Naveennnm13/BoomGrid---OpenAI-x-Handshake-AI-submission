# BoomGrid bug log

Build started: 29 October 2026

## BUG-001

- **Stage:** Stage 1 — Engine
- **Found by:** Engine test
- **Severity:** Minor
- **Area:** Engine test
- **Steps to reproduce:** Run the Suicide Bomb minimum-life test with the default first-player picks, then mark numbers 1 and 2 dead.
- **Expected:** The fixture leaves one live hidden number and reaches the two-live-number validation.
- **Actual:** Number 2 was not one of that player's hidden picks, so two live numbers remained and the fixture instead failed sacrifice validation.
- **Root cause:** The test fixture assumed consecutive default picks, while the helper spaces them across the grid.
- **Fix:** Marked the player's actual hidden picks 1 and 7 dead and used 13 as the attempted sacrifice.
- **Verified by:** Full Stage 1 engine test suite.
- **Status:** Fixed

## BUG-004

- **Stage:** Stage 6a — Statistics
- **Found by:** Release checklist review
- **Severity:** Major
- **Area:** Stats eligibility
- **Steps to reproduce:** Finish a tutorial match or inspect a Practice match with bot attacks.
- **Expected:** Tutorial matches produce no stats and bot calls do not change Hot Numbers.
- **Actual:** The first implementation classified the guided match as ordinary Practice and retained bot call outcomes.
- **Root cause:** The tutorial handoff did not pass a durable room classification, and call aggregates did not record whether the shooter was a bot.
- **Fix:** Added a tutorial room flag through client, API and engine; skipped tutorial writes; tagged call outcomes by bot; filtered bot outcomes from number aggregates; added the My Stats name and public visibility controls.
- **Verified by:** Strict TypeScript, production build, engine classification test and production stats endpoint smoke test.
- **Status:** Fixed

## BUG-002

- **Stage:** Stage 5 — Landing scene
- **Found by:** Strict TypeScript check
- **Severity:** Build blocker
- **Area:** Three.js scene
- **Steps to reproduce:** Run `pnpm exec tsc --noEmit` after adding the voxel hearts scene.
- **Expected:** Three.js and its postprocessing modules resolve with types.
- **Actual:** TypeScript reported missing declarations.
- **Root cause:** The runtime package did not include the declaration package used by this project configuration.
- **Fix:** Added `@types/three` and moved geometry disposal into the component cleanup path.
- **Verified by:** Strict TypeScript and production build.
- **Status:** Fixed

## BUG-003

- **Stage:** Stage 7 — Documents
- **Found by:** Render review
- **Severity:** Minor
- **Area:** Word deliverables
- **Steps to reproduce:** Render the first document draft to page images.
- **Expected:** Every page contains content and titles use whitespace without a decorative rule.
- **Actual:** An explicit page break produced one empty page, and the built in Title style added a blue line.
- **Root cause:** Content already filled the prior page before the manual break, and the default Title style retained its border.
- **Fix:** Removed manual page breaks and the Title paragraph border, then rendered every page again.
- **Verified by:** Full page image inspection of both Word documents.
- **Status:** Fixed

## Assumptions

- Naveen's later direction standardizes all interface text on Silkscreen, overriding the split Silkscreen and Chakra Petch typography in Section 6.4.

