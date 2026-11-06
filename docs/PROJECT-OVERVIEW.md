# BoomGrid project overview

BoomGrid turns a classroom pen-and-paper number game into an online arcade experience. Players hide three numbers, choose opponents, and attack in turns. Losing all hidden numbers eliminates a player. Double Shot, Suicide Bomb, Invincibility, and Radar add limited-use tactical choices.

The recovered implementation supports 2–6 seats, bots, timed turns, highlights, moderated chat with typing indicators, player statistics, sound, and an interactive tutorial. Recovery unit tests do not establish that every visual and network path is flawless.

## System design
React submits actions to a Worker API. The API hashes seat credentials, loads a room, validates actions through the authoritative TypeScript engine, persists state in D1, and returns a viewer-specific projection. Secret picks and Radar results are hidden from other players. Room revisions and compare-and-swap persistence protect against conflicting updates. Request IDs support deduplication.

The engine owns legal actions, turn order, bot decisions, power resolution, elimination, and wins. The client presents controls, state, sound, and effects. The later Vercel deployment uses a Next.js frontend and API proxy; that source is only partially recovered here.

## Product approach
Practice and tutorial flows help newcomers learn before joining friends. Board visibility and highlights make attacks easier to follow. Sequential turns clarify responsibility for each attack. Chat checks reject links, abuse, spam, and flooding, without guaranteeing comprehensive moderation.

## Consistency and capacity
Authoritative validation and revision-checked writes favor coherent state over accepting conflicting actions. Clients should wait for confirmed server state during connectivity loss. This is not a formal CAP guarantee. The intended MVP audience was 100–200 players; capacity and latency need load testing. Free-tier operation was a goal, not a guarantee of unlimited free usage.

## Next steps
Recover the remaining newer frontend files, repeat end-to-end and mobile QA, measure attack latency and reconnect behavior, then explore competitive matchmaking, tournaments, game variants, and better animations.
