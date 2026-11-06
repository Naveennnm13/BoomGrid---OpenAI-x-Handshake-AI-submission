# BoomGrid

A multiplayer number-hunting arcade game inspired by a pen-and-paper game played with friends in class. Built for the OpenAI × Handshake AI submission.

Hide three numbers, take turns attacking opponents, use limited power-ups, and survive until the end. Rooms support 2–6 players, including bot practice, with a maximum grid size of 35.

## Recovery status
This is the complete recovered Sites source snapshot at commit `8c9efd4824f5562ea00d696461f01167441f7ee0`. It is not an exact export of the newer Vercel frontend. See [RECOVERY.md](RECOVERY.md).

## Stack
React 19, TypeScript, Tailwind CSS 4, shadcn-compatible UI components, Vinext/Vite, Cloudflare Workers, D1, and Drizzle.

## Development
Use Node.js >=22.13 and pnpm as declared in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

The root application targets Sites/Cloudflare, not standalone Vercel. Configure a D1 binding named DB and apply the supplied migrations. The original hosting project identity was removed from this export. See [original setup documentation](docs/ORIGINAL-README.md).

## Contents
- app/: game screens, styles, and API.
- components/ui/: game and shared components.
- lib/game.ts: authoritative engine and bots.
- lib/game-audio.ts: arcade audio.
- db/, drizzle/: database definitions and migrations.
- tests/: engine, bot, and turn-order tests.
- public/: assets.
- docs/recovered/: build specification, rulebook, QA records, and submission materials.
- recovery/vercel-partial/: intact newer exports, kept separate from runnable source.

All 31 recovered engine tests pass. A fresh production build and browser QA have not been completed. Historical reports are not new verification claims.

[Project overview](docs/PROJECT-OVERVIEW.md)
