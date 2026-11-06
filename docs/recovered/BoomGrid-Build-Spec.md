# BoomGrid: Build Specification

Version 1.0, 29 October 2026. Product owner: Naveen. Engineer: ChatGPT (Work).

Game title: BoomGrid. This document is the single source of truth for the build.

---

## 0. How to work from this document

1. Read the whole document once. Refer to sections by number after that.
2. Work in the stages listed in Section 11. Complete one stage per message, then stop, report in the format in 11.2, and wait for me to reply "go".
3. Do not paste code back to me. Keep each report under 150 words.
4. If a rule is ambiguous, implement the simplest reading consistent with this document and list it under "Assumptions" in your report. Do not invent mechanics, power-ups or phases that this document does not describe.
5. If a stage still fails after two fix passes, revert that stage, report what broke, and wait for my decision.
6. Log each bug in the running bug log described in 11.4. After the build, deliver the log and the rulebook as Word documents.

---

## 1. Product summary

BoomGrid is a real-time multiplayer number-hunting game for 2 to 6 players, based on a pen-and-paper game played in class. Each player hides 3 numbers on a grid. Each round, all players secretly choose an attack or one power-up, then all actions resolve at once. A player whose 3 numbers all die is out. The last player with a live number wins.

A stats board tracks the most-picked numbers, top players and clutch plays across matches (Section 13).

The game is an entry in the Handshake x OpenAI Multiplayer Game Challenge. Judges score Execution, Creativity, Usefulness and Polish equally. A judge may test the game alone, so Practice vs bots and the tutorial must show the full game. A player must be able to learn the rules without anyone explaining them.

Schedule (Eastern Time): code freeze Friday 30 October at 6 PM. Submission by 10 PM.

---

## 2. Project setup

### 2.1 Stack

Create a new project in ChatGPT Work and publish it through Sites, using the same stack as Naveen's previous build:

- React with TypeScript (strict)
- Tailwind CSS
- shadcn project structure, with components in `/components/ui`
- A Cloudflare Worker API route at `POST /api/game`
- Cloudflare D1 for room storage
- `lucide-react` for icons

If the generated project lacks shadcn structure, Tailwind or TypeScript, set them up through the shadcn CLI before writing game code. Keep reusable components in `/components/ui`. The shadcn CLI and its generated imports expect that path, so components added later land in the same place.

### 2.2 Allowed dependencies

You may add these packages:

- `three` for the landing background (Section 8.2)
- `framer-motion` for interface motion

Do not add other runtime dependencies, paid APIs or AI calls during play.

### 2.3 Ground rules

- The server is authoritative. Do not trust client-supplied picks, actions, deadlines, hit results or power-up counts.
- Never send a player's hidden numbers to another player's browser before the end screen.
- Stats only include finished matches. A live match's picks never feed any stat until it ends.
- Ask me before you change the site's access to public.

---

## 3. Game rules

### 3.1 Players and grids

| Players | Grid (columns by rows) | Numbers |
|---|---|---|
| 2 or 3 | 5 by 5 | 1 to 25 |
| 4 | 5 by 6 | 1 to 30 |
| 5 | 5 by 7 | 1 to 35 |
| 6 | 5 by 8 | 1 to 40 |

The grid size locks when the host starts the match. Each player has their own grid with the same numbers. Numbers fill the grid left to right, top to bottom.

### 3.2 Setup

- After the host starts, each player has 30 seconds to pick 3 different numbers on their own grid.
- Picks are secret. If a player runs out of time, the server fills the remaining picks at random.
- Picks lock when submitted.

### 3.3 Rounds

Each round has three parts:

1. **Choose (20 seconds).** Each living player chooses one action in secret: an attack or one power-up (Double Shot, Suicide Bomb, Invincibility or Radar). A player can use one power-up per round at most. The table sees who has locked in, without seeing their choice. The round ends early once all living players lock in.
2. **Resolve.** The server resolves all actions in the order in 3.5.
3. **Reveal (about 6 seconds).** Each client plays the resolution as an animated sequence (Section 9), then the next round starts.

If a living player does not lock in, the server makes a random attack for them: a random living opponent and a random uncalled number on that board.

### 3.4 Actions

**Attack.** Choose one living opponent and one number on their board that has not been called yet.

- If that number is one of their hidden picks, it dies. The cell shows a hit.
- If not, the cell shows a miss.
- Hits and misses stay visible on that board for the rest of the match, to all players.

**Double Shot.** Choose one living opponent and two different uncalled numbers on their board. Both resolve as attacks.

**Suicide Bomb.** Choose one living opponent. One of your own live numbers dies (you choose which), then one of the target's live numbers dies, chosen at random by the server. Both numbers reveal to the table as hits. You need at least 2 live numbers to use it.

**Invincibility.** Choose no target. For this round, all attacks, Double Shots, Suicide Bombs and Radar scans aimed at you are blocked. You give up your own attack this round.

**Radar.** Choose one living opponent and one row or column on their board. You learn how many of their live numbers sit in that line. You give up your own attack this round.

- The count is private to you. The table sees that you scanned, which player you scanned and which line, without seeing the count.
- Radar reads the board after this round's attacks resolve, so the count reflects this round's hits.
- A row covers 5 cells. A column covers as many cells as the grid has rows (5 to 8).
- If the target is invincible, the scan is jammed and Radar is still used up.

### 3.5 Resolution order

1. **Invincibility** activates for each player who chose it.
2. **Suicide Bombs** resolve in seat order.
   - If the target is invincible, the bomb fizzles. The bomber's sacrificed number survives, and the bomb is still used up.
   - If the bomber's sacrificed number has already died this round, the bomb fizzles and is used up.
3. **Attacks and Double Shots** resolve.
   - A shot at an invincible player is deflected. The number is not marked on that board, so the attacker learns nothing.
   - If two or more players call the same number on the same board in the same round, each of them gets credit for the hit.
   - A shot at a number that died earlier in the same round still counts as a hit for the shooter, with no extra effect.
4. **Radar scans** resolve. A scan on an invincible player is jammed. Otherwise, the scanner receives the live count for that line.
5. **Eliminations** apply. A player whose 3 numbers have all died is out.
6. **Win check** runs (3.7).

### 3.6 Power-up limits and balance

Each player gets this set of power-ups per match:

| Power-up | Uses per match | Cost | Limits |
|---|---|---|---|
| Double Shot | 2 | Uses your action | Both numbers on one board. No repeats. Cannot be used twice in the same round. |
| Suicide Bomb | 1 | Uses your action and one of your own numbers | Requires 2 or more live numbers. Fizzles against Invincibility, with your number refunded. |
| Invincibility | 1 | Uses your action | Lasts one round. Blocks attacks, Double Shots, Suicide Bombs and Radar. |
| Radar | 1 | Uses your action | One row or column on one opponent. Count stays private. Jammed by Invincibility. |

Other limits:

- **One power-up per round.** Each player takes one action per round: an attack or a single power-up. Players cannot combine power-ups or use the same power-up twice in one round. The server rejects any action that tries.
- Each player's remaining power-ups are public, shown as lights on their board: two pips for Double Shot and one light each for Suicide Bomb, Invincibility and Radar. Knowing who still holds Invincibility or a Bomb is part of the strategy.

The balance reasoning behind these rules:

- **Double Shot** doubles one round's chance to hit. Each player gets two, which gives two rounds of extra pressure across a match without breaking the one-power-up-per-round limit. It has no defensive value, so players tend to use the first one early and save the second for a target with few numbers left.
- **Suicide Bomb** is a guaranteed 1-for-1 trade. In a game with three or more players, the trade helps the players outside it, so the Bomb works best as a finisher on a player with one number left. The 2-number minimum stops a player from using it to take themselves out along with the target.
- **Invincibility** costs your attack, so it pays off when you expect several players to target you. Since actions are secret, a well-timed shield can also waste an opponent's Bomb or Radar.
- **Radar** trades a round of damage for information. It is the one source of skill in a guessing game: a count of 1 or 2 in a line turns a 1-in-20 guess into a 1-in-5 guess. Because the table sees who you scanned, it also tells your target they're being hunted.

Do not change these numbers. If play-testing suggests a change, note it in the report and leave the rule as written.

### 3.7 Winning

- The last player with at least one live number wins.
- If all remaining players are eliminated in the same round, the player with the most hits this match wins. If hits tie, those players share the win.
- The end screen reveals each player's hidden numbers and shows a scoreboard (Section 8.9).

### 3.8 Leaving and reconnecting

- A player who closes the tab keeps their seat. The server makes random attacks for them until they return.
- A player can rejoin with the room code from the same browser.

---

## 4. Practice vs bots and bot behavior

Practice mode fills empty seats with bots. The host chooses the total number of seats (2 to 6) before starting.

Bot rules:

- **Picks:** 3 random numbers.
- **Target choice:** 60% of the time, the living opponent with the fewest live numbers. Otherwise, a random living opponent.
- **Invincibility:** used when the bot has 1 live number left and still holds it.
- **Suicide Bomb:** used when a target has exactly 1 live number and the bot has 2 or more live numbers.
- **Double Shot:** first use on a random round from round 3 to round 5, second use on a random round from round 6 to round 9.
- **Radar:** used on a random round from round 2 to round 4, on a random living opponent and a random row or column.
- **Using Radar results:** when a bot holds a reading with a live count above zero on a living opponent, it aims 70% of its attacks at uncalled cells in that line until the line has no uncalled cells left.
- **Otherwise:** a normal attack on a random uncalled number.
- Bot actions go through the same server validation as human actions.
- Bots lock in 2 to 6 seconds into the Choose phase, so players see the lock-in lights move.

---

## 5. System design

### 5.1 Architecture

- The React client sends JSON to `POST /api/game` with an `x-seat-token` header. The browser generates the seat token and keeps it in local storage.
- The Worker authenticates the seat, loads the room from D1, advances due phases, applies the action, and saves with a compare-and-swap on a revision number. It retries up to 8 times on conflict.
- The client polls every 1.5 seconds and keeps a server time offset so countdowns stay in sync.
- Each response contains only the data that player is allowed to see (5.4).

### 5.2 Room record

```ts
type Phase = 'lobby' | 'picking' | 'choosing' | 'reveal' | 'ended';
type ActionKind = 'attack' | 'doubleShot' | 'bomb' | 'invincible' | 'radar';
interface RadarReading { round: number; targetId: string; axis: 'row' | 'col'; index: number; count: number | null } // null = jammed

interface Player {
  id: string; seatKeyHash: string; name: string; color: PlayerColor; isBot: boolean;
  picks: number[];                 // hidden, length 3
  dead: number[];                  // subset of picks
  calledOnMe: Record<number, 'hit' | 'miss'>; // public board state
  powers: { doubleShot: number; bomb: boolean; invincible: boolean; radar: boolean }; // doubleShot starts at 2, others true = still available
  radarReadings: RadarReading[];   // private to this player
  hits: number;                    // hits landed this match
  alive: boolean; lockedIn: boolean;
}

interface Room {
  code: string; hostId: string; practice: boolean;
  phase: Phase; round: number; deadline: number;
  gridRows: number; gridSize: number;          // gridSize = 5 * gridRows
  players: Player[];
  pendingActions: Record<string, PlayerAction>; // hidden until resolved
  lastResolution: ResolutionEvent[] | null;     // ordered, for the reveal animation
  winnerIds: string[];
  revision: number; requestIds: string[];       // last 100 for dedupe
}

interface PlayerAction {
  kind: ActionKind; targetId?: string; numbers?: number[]; sacrifice?: number;
  line?: { axis: 'row' | 'col'; index: number }; // Radar only
}

type ResolutionEvent =
  | { type: 'shield'; playerId: string }
  | { type: 'bomb'; by: string; target: string; sacrificed: number; killed: number | null; fizzled: boolean }
  | { type: 'shot'; by: string; target: string; number: number; result: 'hit' | 'miss' | 'deflected'; double: boolean }
  | { type: 'radar'; by: string; target: string; axis: 'row' | 'col'; index: number; jammed: boolean } // count goes only to the scanner's radarReadings
  | { type: 'eliminated'; playerId: string }
  | { type: 'win'; playerIds: string[] };
```

### 5.3 Actions

| Action | Fields | Allowed when | Server checks |
|---|---|---|---|
| `create` | name, practice, seats (practice only) | Any time | Name 1 to 16 characters |
| `join` | code, name | Lobby | Room exists, fewer than 6 players |
| `start` | none | Lobby, host | 2 to 6 players seated |
| `pick` | numbers (3) | Picking | Distinct, within grid size |
| `act` | PlayerAction | Choosing, living player | One action per round, valid target, uncalled numbers, power available (Double Shot count above 0), Bomb needs 2 live numbers and a live sacrifice, Radar line within the grid |
| `poll` | none | Any time | Seat token valid |
| `rematch` | none | Ended, host | Resets picks, powers and boards, recalculates grid size for the seated players |

User-facing error strings (HTTP 400):

- "That number's already been called on this board."
- "You've used both Double Shots."
- "You've used your Suicide Bomb."
- "You've used your Invincibility."
- "You've used your Radar."
- "Pick a row or column to scan."
- "You can use one power-up per round."
- "You need 2 live numbers to use Suicide Bomb."
- "That player is out."
- "Pick 2 different numbers for Double Shot."
- "Time's up for this round."

### 5.4 Privacy

| Data | Visible to |
|---|---|
| Your own picks | You |
| Other players' picks | Nobody until the end screen |
| Called numbers, hits and misses on each board | Everyone |
| Remaining power-ups for each player | Everyone |
| Who has locked in this round | Everyone |
| What each player chose this round | Nobody until the reveal |
| Radar scan: who scanned, which player and which line | Everyone, after resolution |
| Radar count | The scanner |
| Resolution events | Everyone, after resolution |

Add a test confirming no response contains another player's picks or pending action before they should be visible.

### 5.5 Phase timing

- Phase deadlines live on the server. Any incoming request advances a due phase.
- The Choose phase ends at its deadline or once all living players lock in, whichever happens first.
- The reveal phase lasts 6 seconds. The client keys the reveal animation to the round number, so an idle poll never replays it.

### 5.6 Tests to add

1. Grid size for 2, 3, 4, 5 and 6 players, including a rematch with a different count
2. Pick validation and random fill on timeout
3. Attack hit, miss and the already-called error
4. Double Shot with two numbers, the repeat-number error, two uses per match and the error on a third use
5. Suicide Bomb kill, the 2-live-number minimum, fizzle against Invincibility with refund, and fizzle when the sacrificed number died earlier in the round
6. Invincibility deflecting attacks, Double Shots, Bombs and Radar, lasting one round
6a. Radar counts for a row and a column at each grid size, the count after same-round hits, the jammed result, the one-use limit, and a privacy check that no other player receives the count
6b. One power-up per round: the server rejects an action combining power-ups
7. Same-number collision crediting both shooters
8. Resolution order matching 3.5
9. Elimination, last-player win, simultaneous elimination with the hits tiebreak and a shared win
10. Random action for players who don't lock in
11. Early round end once all living players lock in
12. Privacy as in 5.4
13. A full bot match at 2, 4 and 6 seats finishing without errors

---

## 6. Visual direction

### 6.1 Concept

A neon arcade cabinet at night. Each match feels like a cabinet screen: pixel type, hard edges, hot color against deep plum, and a control deck of physical-looking arcade buttons. The game's one big moment is the reveal, when all attacks fire at once (Section 9.2).

### 6.2 Avoid

- Glassmorphism, blurred panels and frosted cards
- Gradient text and gradient washes on panels
- Rounded SaaS cards with soft grey shadows
- Neon glow on everything. Glow marks things that are live or active: your turn, a hit, an active power-up.
- Purple-to-pink hero gradients as decoration
- Emoji used as icons
- Stock "futuristic" copy such as "Enter the arena" or "Unleash your power"

### 6.3 Color palette

Use these colors. Pure white is allowed as a neutral for body text.

| Token | Hex | Role |
|---|---|---|
| `--plum` | `#2B0A30` | Page background |
| `--indigo` | `#3D0C8A` | Cabinet frame, panels, empty cells |
| `--violet` | `#9030E8` | Misses, borders, secondary UI |
| `--magenta` | `#F516C4` | Player color, headline accents |
| `--hot` | `#FF1E56` | Hits, danger, Suicide Bomb |
| `--raspberry` | `#A8104D` | Dead numbers, eliminated boards, bomb debris |
| `--cyan` | `#1FEFE3` | Invincibility, your turn, focus ring |
| `--blue` | `#2B8AF2` | Player color, links, info |
| `--mint` | `#2CF08F` | Player color, live numbers, Radar |
| `--yellow` | `#FFDD2D` | Double Shot, primary action, timers |
| `--white` | `#FFFFFF` | Body text |

Player colors in seat order: cyan, magenta, yellow, mint, blue, violet.

Contrast rules:

- Body text is white or yellow on plum or indigo.
- Do not use raspberry or indigo for text on plum, since the contrast is too low.
- Check WCAG AA for each text and background pair you use.

### 6.4 Typography

- **Silkscreen** (Google Fonts) for display: the title, round numbers, grid numbers, power-up names, and big moments such as "Round 3", "Game over" and "Player 2 wins".
- **Chakra Petch** (Google Fonts) for body text, rules, dialogs, buttons and chat-style labels. Use tabular numerals for timers.
- Load both in the app layout with `display=swap`. Do not inject font links from inside components.
- Use sentence case for body text and buttons. Uppercase is reserved for pixel display moments.

### 6.5 Shape, depth and texture

- Square corners on cells, panels and buttons. Arcade buttons on the control deck are the one exception, and they are round.
- Borders: 2px for cells and 4px for the cabinet frame.
- Depth comes from hard offset shadows (4px, no blur, in plum or indigo), never soft shadows.
- A CRT scanline overlay covers the game screen at 6% opacity, with a faint vignette at the edges. The overlay is static. It does not intercept clicks.

### 6.6 Motion rules

- Animate state changes: a lock-in, the reveal, a hit, a miss, a power-up, an elimination, a win.
- Key each animation to a change in round, phase or revision. A poll with no change must not replay anything or shift layout.
- The Choose phase stays calm. The reveal carries the action.
- With `prefers-reduced-motion`, replace screen shake, particles and flashes with instant state changes and short color fades. All information stays readable.

---

## 7. Sound

Generate chiptune cues with the Web Audio API using square and triangle waves, with no audio files and no paid API. Sound starts muted and turns on with the speaker button.

| Event | Cue |
|---|---|
| Lock in | Short coin blip |
| Countdown, last 5 seconds | Soft tick each second |
| Miss | Low descending blip |
| Hit | Bright two-note zap |
| Double Shot | Two rapid zaps |
| Suicide Bomb | Rising fuse hiss, then a noise burst |
| Invincibility | Shimmering arpeggio |
| Radar | Sonar ping that sweeps up in pitch, then a short beep per live number found |
| Deflect | High ping |
| Elimination | Classic falling "game over" phrase |
| Win | Short victory fanfare |

---

## 8. Screens and layout

### 8.1 Screen list

1. Landing
2. Tutorial (Section 10)
3. Lobby
4. Picking
5. Match: Choose and Reveal
6. End screen
7. Stats board (Section 13)

### 8.2 Landing

Treat the landing as the cabinet's attract screen.

- **Background:** a `three` scene with a starfield and a soft bloom pass. Three large voxel hearts drift through it, built from cubes in hot, magenta and mint, one for each life. When a heart drifts near the center, it shatters into pixel cubes and reforms. This background is for the landing page alone.
- **Title:** "BoomGrid" in Silkscreen, revealed one letter at a time with a short stagger, with a 3px hard offset shadow in magenta.
- **Subtitle (Chakra Petch):** "Hide 3 numbers. Hunt everyone else's. Last one alive wins."
- **Buttons:** "Host a game", "Join with a code", "Practice vs bots", "How to play" and "High scores". Use square buttons with a 2px border and a 4px offset shadow. Pressing a button shifts it down into its shadow.
- A blinking "Press start" prompt sits above the buttons and pulses at 1 Hz.

Engineering requirements for the `three` scene:

- Lazy-load the scene after first paint, so the buttons are usable before it loads.
- Cap the device pixel ratio at 2.
- Cancel `requestAnimationFrame` and dispose geometries, materials, the renderer and the composer on unmount.
- Pause rendering when the tab is hidden.
- On touch devices, replace mouse tracking with a slow automatic drift.
- With reduced motion, show a static frame of the scene.
- If WebGL fails to start, fall back to a CSS starfield.

### 8.3 Lobby

- The room code shows large in Silkscreen, with a copy button and a share link.
- Seats appear as cabinet player slots (P1 to P6), filled in each player's color as they join. Empty slots blink "Insert coin".
- The grid size updates live as players join, with the message "5 by 6 grid for 4 players".
- The host sees "Start" once 2 players are seated.

### 8.4 Picking

- Your grid fills the screen.
- Tap 3 cells to pick them. Picked cells glow mint, with a small heart icon.
- Show "Lock in picks" and the 30-second timer.
- Other players' slots show a lock icon as they finish.

### 8.5 Match layout (desktop)

```
+----------------------------------------------------------------------+
| ROUND 4                         [ 0:14 ]               sound  rules  |
+------------------+--------------------------------+------------------+
|  YOUR BOARD      |      TARGET BOARD (large)      |  OPPONENTS       |
|  (small grid,    |      selected opponent's grid  |  mini-boards,    |
|  your hearts,    |      tap cells to aim          |  live numbers,   |
|  your powers)    |                                |  power lights,   |
|                  |                                |  lock-in light   |
+------------------+--------------------------------+------------------+
|  CONTROL DECK: (DOUBLE SHOT x2) (BOMB) (INVINCIBLE) (RADAR)  [FIRE] |
+----------------------------------------------------------------------+
```

- **Cabinet frame:** a 4px indigo border with a magenta inner line around the whole match area.
- **Header:** the round number, a large countdown in yellow that turns hot in the last 5 seconds, and the sound and rules buttons.
- **Target board:** the selected opponent's grid at large size, with their color on the frame and their name in Silkscreen above it.
- **Your board:** your own grid at small size. Your picks show as hearts. Dead picks show as broken hearts in raspberry.
- **Opponents column:** a mini-board for each opponent. Each shows called cells, live number count as hearts, power lights (two pips for Double Shot, one light each for the others, lit while available) and a lock-in light for this round. Tapping a mini-board makes it the target.
- **Control deck:** four round arcade buttons for the power-ups (Double Shot in yellow with two pips showing uses left, Suicide Bomb in hot, Invincibility in cyan, Radar in mint) and a wide "Fire" button. A used-up power-up's button goes dark and shows "Used". Pressing one power-up button releases any other that was pressed, since a player can use one power-up per round. Pressing an arcade button animates it pressing down into the deck.
- **Radar readings:** in your view, each of your Radar readings shows as a dashed mint bracket along that row or column of the scanned board, labeled with the count and the round, such as "2 live, R3".

### 8.6 Cell states

| State | Treatment |
|---|---|
| Uncalled | Indigo fill, white Silkscreen number |
| Aimed this round | Yellow 2px outline with a pulsing crosshair |
| Miss | Violet fill at 40%, a violet scratch line across the number |
| Hit | Hot fill, white number, pixel X |
| Your live pick (your board) | Mint heart icon behind the number |
| Your dead pick (your board) | Raspberry broken heart |
| Deflected (reveal only) | Cyan spark on the shield, then the cell returns to uncalled |
| In a Radar line (your view) | Dashed mint bracket along the line, with the count at the line's end |

### 8.7 Choose flow

1. Tap an opponent's mini-board to target them. Their board moves into the large view.
2. Tap a cell to aim. For Double Shot, press the Double Shot button first, then aim at two cells. For Suicide Bomb, press the button, choose a target, then tap one of your own live numbers to sacrifice. For Radar, press the button and choose a target. Row and column handles appear along the edges of their board, and you tap one. Invincibility needs no target.
3. Press "Fire". The Fire button locks, your lock-in light turns on, and the button text changes to "Locked in".
4. You can change your choice until you press Fire.

The confirm button names the action, such as "Fire at 17", "Double Shot 4 and 22", "Bomb Riya", "Scan row 3 on Riya" or "Go invincible".

### 8.8 Mobile (under 768px)

- The header is pinned at the top.
- The target board sits below the header at full width.
- Opponents appear as a sideways-scrolling strip of mini-boards below the target board.
- Your board opens as a small inset button that expands to a drawer.
- The control deck is fixed to the bottom of the screen, with buttons at 56px or larger.
- Test at 375px with 6 players on a 5 by 8 grid. Cells must stay at least 44px wide on the target board.

### 8.9 End screen

- "Game over" in Silkscreen, then the winner's slot lights up with "Player {n} wins" (or "Shared win" with each name).
- A reveal of each player's hidden numbers, shown on their boards.
- A scoreboard styled as an arcade high-score table: rank, name in player color, hits landed, numbers lost and power-ups used.
- **Match highlights:** the clutch plays from this match (13.5), each as a card with a replay button.
- Buttons: "Rematch" (host), "High scores" and "Back to start".

---

## 9. Animation specification

### 9.1 Lock-in

When a player locks in, their lock-in light flicks on with a 120ms flash in their color. Your own Fire button presses down and holds.

### 9.2 The reveal sequence

The reveal is the signature moment of the game. When the round resolves, the client plays `lastResolution` in order over about 6 seconds:

1. **Dim (300ms):** the control deck dims and a "Round {n}" banner slides across in Silkscreen.
2. **Shields:** each Invincibility plays (9.5).
3. **Bombs:** each Suicide Bomb plays (9.4).
4. **Volley:** all shots fire together. Each shot is a pixel bolt in the attacker's color, traveling from their mini-board to the target cell on an arc over 400ms. Then each hit, miss or deflection plays (9.6, 9.7).
5. **Radar:** each scan plays (9.5a).
6. **Eliminations:** each elimination plays (9.8).
7. **Settle (300ms):** boards show their new state and the next round's timer starts.

If the tab was hidden during the reveal, skip straight to the final state.

### 9.3 Double Shot

- **On use:** the Double Shot button flashes yellow, one of its two pips goes dark, and "Double shot" stamps across the attacker's mini-board in Silkscreen.
- **In the volley:** two yellow bolts fire 120ms apart, with a brief yellow motion trail.
- **On hit:** each impact flashes yellow before turning hot. If both shots hit, "Double hit" pops above the board and bounces once.

### 9.4 Suicide Bomb

1. The bomber's sacrificed cell blinks hot three times over 600ms, with a pixel fuse spark.
2. A pixel fuse line burns from the bomber's board to the target's board over 500ms, leaving raspberry embers.
3. A random live cell on the target board detonates: a burst of 24 pixel cubes in hot, yellow and raspberry, a 6-frame white flash on the cell, and a 250ms screen shake of 4px.
4. Both cells turn to hit state.
5. **On fizzle:** the fuse reaches a shield and sputters out in a puff of violet smoke. "Fizzled" appears on the bomber's board. The sacrificed cell returns to live.

### 9.5 Invincibility

- **On reveal:** a cyan pixel force field assembles around the player's board, one ring of pixels at a time, over 400ms. Faint cyan scanlines shimmer across the board.
- **On deflect:** an incoming bolt or fuse hits the field, sends a cyan spark in a hex pattern, and bounces off at an angle before fading.
- **At round end:** the field shatters into cyan pixels that fall and fade over 400ms.

### 9.5a Radar

- **For all players:** a mint sweep line runs along the scanned row or column of the target board over 500ms, with a faint mint trail. A small radar icon pings on the scanner's mini-board.
- **For the scanner:** when the sweep ends, the count stamps at the end of the line in Silkscreen ("0 live", "1 live" and so on), with one beep per live number. The dashed mint bracket from 8.5 then stays on that line.
- **On jam:** the sweep hits the target's force field, breaks into static noise, and "Jammed" appears on the scanner's mini-board.

### 9.6 Hit

- The cell flashes white for 2 frames, then fills hot with a pixel X.
- 12 pixel cubes burst out from the cell.
- "+1" floats up in the shooter's color.
- If the hit was the target's last number, the elimination plays right after.

### 9.7 Miss

A violet scratch line wipes across the cell from left to right over 200ms, and the cell dims.

### 9.8 Elimination

- The board collapses like an old CRT turning off: it squashes into a horizontal white line, then into a dot, over 500ms.
- The board then returns in raspberry and indigo with "Out" stamped across it.
- That player's mini-board slot shows a skull built from pixels.

### 9.9 Win

- The winner's board lifts and grows to the center of the screen.
- Pixel confetti falls in all six player colors.
- "Player {n} wins" types out letter by letter in Silkscreen, then the scoreboard rises from the bottom.

---

## 10. Tutorial and new-player hints

### 10.1 Tutorial

The tutorial is a scripted practice match against two bots on a 5 by 5 grid. It starts on a player's first visit, and players can replay it from "How to play" or the rules button. Each dialog box points at the part of the screen it describes, dims everything else, and shows "Step {n} of 11" with Next and Skip buttons. Dialogs use Chakra Petch on an indigo panel with a 2px cyan border and a hard offset shadow.

| Step | Points at | Dialog |
|---|---|---|
| 1 | Whole screen | "Each player hides 3 numbers. Lose all 3 and you're out. The last player with a live number wins." |
| 2 | Your grid | "Tap 3 numbers to hide them. Other players can't see your picks." |
| 3 | Opponent boards | "These are your opponents' boards. Each number called on a board stays visible, so you can see what's been tried." |
| 4 | Bot A's board | "Tap a board to target it, then tap a number to aim. Press Fire to lock in before the timer runs out." |
| 5 | Reveal | "All attacks land at once. A violet scratch is a miss. A red X means a hidden number died." |
| 6 | Your grid | "Bot B hit one of your numbers. You have 2 left." |
| 7 | Double Shot button | "Double Shot lets you call 2 numbers on one board. Try 7 and 13." |
| 8 | Invincibility button | "Bot B is coming for you. Invincibility blocks all attacks on you this round, but you skip your own attack." |
| 9 | Radar button | "Radar scans one row or column on a board and tells you how many live numbers are in it. Only you see the count. Scan row 2 on Bot A." |
| 10 | Suicide Bomb button | "Suicide Bomb trades one of your numbers for one of theirs, guaranteed. You need 2 live numbers to use it." |
| 11 | Whole screen | "You get 2 Double Shots and 1 of each other power-up, and you can use one power-up per round. Knock out both bots to win." |

Script requirements:

- Fix the bots' picks so step 6 lands a hit on the player, step 7 lands a hit for the player, and the step 9 scan returns a count of 1.
- In steps 7 to 10, the tutorial requires the player to use each power-up, highlighting the matching button. The step 7 Double Shot uses one of the player's two.
- After step 11, the match continues as a normal practice game.
- On finishing, show "Tutorial complete" with "Host a game" and "Practice vs bots".

### 10.2 New-player hints

For a player's first three matches, short hints appear in a small panel above the control deck when certain things happen. Players can turn hints off in settings. Store the match count and the setting in local storage.

| When this happens | Hint |
|---|---|
| You aim at a number already called on that board | "That number's already been called on this board. Pick another." |
| You haven't locked in with 5 seconds left | "Press Fire, or the game picks a random attack for you." |
| You lose your first number | "You have 2 numbers left. Invincibility can buy you a round." |
| You're down to 1 number | "One number left. You can't use Suicide Bomb now." |
| An opponent is down to 1 number | "{name} has one number left. Finish them before someone else does." |
| You still hold all your power-ups in round 5 | "Your power-ups don't carry over to the next match. Don't save them too long." |
| Your Radar found live numbers | "Radar found {n} live in that line. Aim there before they're gone." |
| You try to press a second power-up in one round | "One power-up per round. Your last choice replaced the first." |
| An opponent still holds Invincibility and you're about to Bomb them | "{name} still has Invincibility. A shield makes your bomb fizzle." |

### 10.3 Rules panel

A "Rules" button in the header opens a drawer with the rules in plain language, grouped by: Goal, Setup, Rounds, Power-ups, Winning. Include the grid size table and the resolution order.

---

## 11. Execution plan

### 11.1 Stages

Complete in order. Stop after each stage and wait for "go".

| Stage | Scope | Acceptance |
|---|---|---|
| 0. Setup | Section 2: new project, stack, shadcn structure, D1, first publish | Site loads at a new URL |
| 1. Engine | Section 3 and 5: rooms, picking, rounds, actions, resolution, wins | Tests 1 to 12 pass |
| 2. Bots and practice | Section 4 | Test 13 passes. A solo player can run a 6-seat practice match to the end. |
| 3. Visual system | Section 6, Section 8.3 to 8.8 without animations | Palette, type, layout and cell states in place at desktop and 375px |
| 4. Reveal and power-up animations | Section 9 and Section 7 | Each power-up animation plays. Idle polls don't replay anything. Reduced motion works. |
| 5. Landing and end screen | Sections 8.2 and 8.9 | `three` scene meets all of 8.2's engineering requirements |
| 6. Tutorial and hints | Section 10 | A new player completes the tutorial in about 2 minutes |
| 6a. Stats board | Section 13 | Tests in 13.8 pass. A finished practice match shows highlights on the end screen and appears in My stats. |
| 7. Final QA | Section 12, rulebook, bug log, share assets | Checklist complete |

**Cut line:** if time runs short, Stages 0 to 4 and 6 form the minimum release. Stage 5 adds polish. In Stage 6a, build match highlights and My stats first, then the global boards. Tell me when a stage looks likely to push past the 6 PM ET freeze.

### 11.2 Report format

```
Stage: {number and name}
Changed: {files, one line each}
Tests: {passed}/{total}, type check {pass or fail}
URL: {site URL}
Assumptions: {any ambiguous rules you resolved}
Known issues: {anything I should test}
Bugs logged: {new this stage} new, {open total} open
```

For Stages 3 to 6, attach screenshots at desktop width and 375px: the lobby, picking, the Choose phase with 6 players, a reveal with each power-up including a Radar scan and a jammed scan, an elimination and the end screen.

### 11.3 Fix loop

I will report bugs in this form:

```
When I did [action, and in which window], I expected [result], but instead [what happened]. Fix that and keep the change small.
```

Fix the reported issue, rerun the tests and the type check, and report in the 11.2 format.

### 11.4 Bug log

Keep a running bug log in `docs/bug-log.md`, kept out of the published build. Log each defect found after the code for it was first written: a failing test, a type check error, a broken bot match, a privacy leak, a visual or layout defect, and each bug I report. Log each stage you revert.

Fields: ID (BUG-001 onward), Stage, Found by (engine test, type check, bot match, browser test or Naveen), Severity (Blocker, Major, Minor or Cosmetic), Area (Engine, API, Privacy, UI, Animation, Mobile or Rules text), Steps to reproduce, Expected (with spec section), Actual, Root cause, Fix, Verified by, Status (Fixed, Open, Won't fix with reason, or Reverted).

After Stage 7, convert the log to `BoomGrid-Bug-Log.docx` on landscape pages, with a summary table by severity and status, open issues first with workarounds, reverted stages, the full log sorted by ID, and the assumptions you made. Give me the download link in the chat.

### 11.5 Deliverables after the build

- `BoomGrid-Bug-Log.docx` (11.4)
- `BoomGrid-Rulebook.docx`: the rules from Section 3 in plain language for players, with the grid table, power-up table (including Double Shot's 2 uses and the one-power-up-per-round rule), Radar, resolution order and a worked example of one 3-player round
- A 1920 by 1080 PNG cover image for the contest entry: the cabinet screen mid-reveal, with bolts flying across boards and the title in Silkscreen
- An Open Graph image at 1200 by 630 from the same scene, a pixel heart SVG favicon, and a meta description: "Hide 3 numbers. Hunt everyone else's. A real-time arcade showdown for 2 to 6 players."

---

## 12. Final acceptance checklist

- [ ] All engine tests pass and the type check is clean
- [ ] A production build succeeds and the site is published
- [ ] Two real browsers (one normal, one private window) complete a match, with bots filling the other seats
- [ ] A solo player can finish the tutorial and a 6-seat practice match
- [ ] Grid size is correct for 2 to 6 players
- [ ] Double Shot works twice per player per match, the other power-ups once, and each button goes dark when used up
- [ ] Players can use one power-up per round, and the server rejects combined power-ups
- [ ] Radar counts are correct and visible to the scanner alone
- [ ] Each power-up plays its full animation in the reveal
- [ ] No response leaks another player's picks or pending action (checked in the browser network panel)
- [ ] Idle polls cause no animation replay or layout shift
- [ ] Reduced motion replaces shake, particles and flashes, and the game stays readable
- [ ] The landing `three` scene cleans up on unmount, pauses in hidden tabs and falls back without WebGL
- [ ] Layout works at 375px with 6 players on a 5 by 8 grid
- [ ] Keyboard focus is visible on each control
- [ ] Text contrast passes WCAG AA
- [ ] Stats board shows High scores, Hot numbers, Clutch plays and My stats, with correct empty states
- [ ] Finishing a match records stats once, even if the final request repeats
- [ ] Bot picks and tutorial matches stay out of all stats
- [ ] A player who turns off "Show me on high scores" disappears from public boards
- [ ] Bug log, rulebook, cover image, Open Graph image and favicon delivered
- [ ] Access setting confirmed with me before making the site public

---

## 13. Stats board: hot numbers, high scores and clutch plays

### 13.1 Purpose

The stats board gives players a reason to come back and a meta-game to play against. If the board shows that players pick 7 and 13 more than other numbers, a smart player attacks those first and avoids picking them. It also shows judges a finished product with memory beyond a single match.

### 13.2 Player profiles

The game has no accounts, so stats attach to a browser profile:

- On first visit, the browser creates a profile ID and a profile secret with cryptographic randomness and keeps both in local storage. The server stores a hash of the secret.
- Each profile has a display name (1 to 16 characters) and a 4-digit tag generated by the server, shown as "Naveen #4821". The tag tells apart players who share a name.
- Players can change their display name from My stats. The tag stays the same.
- A "Show me on high scores" setting, on by default, controls whether the profile appears on public boards. Personal stats keep working either way.
- Clearing browser storage starts a new profile. Say so in a single line on My stats: "Your stats live in this browser. Clearing site data resets them."

### 13.3 Which matches count

| Match type | High scores | Hot numbers | Clutch plays (public feed) | My stats |
|---|---|---|---|---|
| 2 or more human players | Yes | Human picks | Yes | Yes |
| Practice vs bots (1 human) | No | Human picks | No | Yes, marked "vs bots" |
| Tutorial | No | No | No | No |

Bot picks, bot actions and bot results never enter any stat. This keeps practice runs from inflating the boards.

### 13.4 Data model

Add these D1 tables. Write them once per match, when the match ends.

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY, secret_hash TEXT NOT NULL, name TEXT NOT NULL, tag TEXT NOT NULL,
  public INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL,
  matches INTEGER DEFAULT 0, wins INTEGER DEFAULT 0, shots INTEGER DEFAULT 0, hits INTEGER DEFAULT 0,
  numbers_lost INTEGER DEFAULT 0, clutch_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, best_streak INTEGER DEFAULT 0, last_played INTEGER
);
CREATE TABLE matches (
  id TEXT PRIMARY KEY, ended_at INTEGER NOT NULL, player_count INTEGER NOT NULL,
  human_count INTEGER NOT NULL, grid_size INTEGER NOT NULL, rounds INTEGER NOT NULL, practice INTEGER NOT NULL
);
CREATE TABLE match_players (
  match_id TEXT NOT NULL, profile_id TEXT, seat INTEGER NOT NULL, is_bot INTEGER NOT NULL,
  placement INTEGER NOT NULL, won INTEGER NOT NULL, shots INTEGER NOT NULL, hits INTEGER NOT NULL,
  picks TEXT NOT NULL, survived TEXT NOT NULL, powers_used TEXT NOT NULL,
  PRIMARY KEY (match_id, seat)
);
CREATE TABLE number_stats (
  grid_size INTEGER NOT NULL, number INTEGER NOT NULL,
  picked INTEGER DEFAULT 0, survived INTEGER DEFAULT 0, attacked INTEGER DEFAULT 0, hit INTEGER DEFAULT 0,
  PRIMARY KEY (grid_size, number)
);
CREATE TABLE clutch_plays (
  id TEXT PRIMARY KEY, match_id TEXT NOT NULL, round INTEGER NOT NULL, profile_id TEXT,
  kind TEXT NOT NULL, detail TEXT NOT NULL, replay TEXT NOT NULL, public INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX clutch_recent ON clutch_plays (public, created_at);
CREATE INDEX matches_recent ON matches (ended_at);
```

Field notes:

- `number_stats.picked` counts human picks of that number. `survived` counts picks still alive at match end. `attacked` counts times any player called that number, and `hit` counts the calls that killed a pick.
- `clutch_plays.replay` holds the resolution events for that round (from `lastResolution`) plus the board state before it, so the stats board can replay the moment.
- Keep stats by grid size, since 1 to 25 and 1 to 40 aren't comparable.

### 13.5 Clutch plays

The server detects these moments while resolving rounds and saves them when the match ends. Each player can earn several in one match.

| Clutch play | Detection rule | Card copy |
|---|---|---|
| Last life | The winner had 1 live number at match end | "{name} won with one life left." |
| Comeback | The winner had the fewest live numbers at the end of any round where 3 or more players were alive | "{name} came back from last place to win." |
| Iron wall | Invincibility blocked attacks from 2 or more players in one round | "{name}'s shield stopped {n} attacks in round {r}." |
| Defused | Invincibility made a Suicide Bomb fizzle | "{name} shielded at the right moment and fizzled {bomber}'s bomb." |
| Double down | Both shots of a Double Shot hit | "{name} landed both shots of a Double Shot." |
| Double knockout | A single action eliminated a player with 2 live numbers | "{name} took out {target} with one move." |
| Radar lock | A hit in a Radar-scanned line within 2 rounds of the scan | "{name} scanned {target} and struck in round {r}." |
| Survivor | Survived a round where 3 or more players targeted them | "{name} survived {n} attackers in round {r}." |
| Sudden death | The match ended with a simultaneous elimination, decided by hits | "{name} won sudden death on hits." |
| Kingslayer | Eliminated the player with the most hits at that point | "{name} knocked out the top shooter, {target}." |

Each card names the match's grid size and player count, such as "6 players, 5 by 8".

### 13.6 Stats board screens

Open the board from "High scores" on the landing and end screens. It has four tabs, and the URL keeps the open tab so players can share a link to it.

**High scores**

- An arcade high-score table with the top 10 for the chosen board. The rank 1 row blinks gently. Show names in the player's tag color, which comes from a hash of the tag, mapped to one of the six player colors.
- Board selector: Wins, Win rate (5 or more matches), Accuracy (hits divided by shots, 30 or more shots), Best streak (consecutive wins), Clutch plays.
- Time selector: This week, All time.
- If the viewing player is outside the top 10, their own rank shows as an extra row at the bottom.
- Ties sort by wins, then by hits.

**Hot numbers**

- A grid-size selector for 5 by 5, 5 by 6, 5 by 7 and 5 by 8.
- A heat map drawn as the real game grid. Each cell's fill runs from indigo (rarely picked) through violet, magenta and hot to yellow (most picked), with the pick share as a small label.
- A toggle to switch the heat map between Most picked, Survival rate (survived divided by picked), and Most attacked.
- Beside the map, a pixel bar chart of the top 5 and bottom 5 numbers for the chosen view.
- One line of insight generated from the data, such as "Players pick 7 twice as often as 18." Use a fixed sentence template, with no AI call.
- Show the heat map after a grid size has 30 or more human picks. Until then: "Not enough games on this grid yet. Play a few rounds and check back."

**Clutch plays**

- A feed of the 20 most recent public clutch plays, newest first, each as a card with the card copy, player names in their colors, and the time since it happened.
- Each card has a "Replay" button that plays that round on a mini-board, using the same animations as the match reveal.
- A filter by clutch type.

**My stats**

- The player's name, tag, and the "Show me on high scores" setting, plus a rename control.
- Totals: matches, wins, win rate, accuracy, best streak, clutch plays.
- Their own favorite picks as a small heat map, with the line "You pick {n} in {x}% of your matches." This shows players their own habits, which opponents can also learn from Hot numbers.
- Their last 10 matches as rows: result, placement, grid size, hits, and "vs bots" where it applies.
- Their clutch plays, with replays.

Build charts and heat maps with plain elements and CSS in the arcade style from Section 6. Do not add a chart library.

### 13.7 API and write path

New actions on `POST /api/game`:

| Action | Fields | Returns |
|---|---|---|
| `profile` | name (on create or rename), public | Profile with tag |
| `stats` | tab, board, window, gridSize, clutchKind | The data for that tab |
| `myStats` | none (profile from the header) | The player's own stats |

- The browser sends the profile ID and secret in an `x-profile` header. The server checks the hash.
- When a match ends, the server first saves the room with `phase: 'ended'` and `statsRecorded: false`. It then writes all stats rows in one D1 batch and sets `statsRecorded: true`. If the batch fails, the next request on that room retries it. The `matches` primary key makes the write idempotent, so a repeated batch changes nothing.
- Weekly boards query `match_players` joined with `matches` for the last 7 days, limited to 10 rows. All-time boards read the totals in `profiles`.
- `stats` responses may use `Cache-Control: max-age=30`. Live game responses stay `no-store`.
- Public boards exclude profiles with `public = 0`.

### 13.8 Tests

1. Ending a match writes each table once, and a repeated end request writes nothing new
2. Bot picks and results stay out of `number_stats` and `profiles`
3. Practice matches update My stats and Hot numbers but not High scores or the public clutch feed
4. Tutorial matches write nothing
5. Each clutch play in 13.5 detects correctly from a scripted match, and does not fire in a near-miss case
6. Win rate and accuracy boards respect their minimums
7. Weekly boards exclude matches older than 7 days
8. A private profile is absent from public boards and present in My stats
9. Stats from a match in progress do not appear anywhere until it ends
10. The profile secret check rejects a wrong secret

### 13.9 Hints and empty states

| Surface | Copy |
|---|---|
| High scores, no data | "No high scores yet. Win a match with friends to claim the top spot." |
| Clutch plays, no data | "No clutch plays yet. Win with one life left and you'll be the first." |
| My stats, no matches | "Play a match and your stats will start here." |
| First visit to Hot numbers | "This map shows which numbers players hide most. Use it to aim, or to hide where nobody looks." |
