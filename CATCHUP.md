# Catch-up Notes — Gamified Portfolio Hub

Read this file first in any new session on this project — it's written to be a complete,
standalone picture of the project so far, no prior conversation needed.

## What this project is

A "Gamified Portfolio Hub": a cozy 16-bit pixel-art bedroom (Lo-Fi aesthetic, pastel
purples/pinks, neon accents) that visitors explore to learn about "Roli" as a person, not just
professionally. 20 clickable objects in the room, each with dialogue from a companion character
("Snippy," a pair of scissors, Olaf-personality). Eventually a "Computer" object gated behind
payment/bypass-code links out to Roli's real professional sites with a fun custom UI wrapper.

**Source of truth for the 20 objects' dialogue/behavior spec**: a user-authored file,
`~/Downloads/Roli Room Interaction Table.txt` (not in this repo — local to the user's machine).
It defines each `OBJ_01`–`OBJ_20`'s asset name, interaction type, free-tier dialogue, and intended
action. `lib/roomData.ts` implements this spec.

## Repo / deploy facts

- **Real repo path**: `/Users/rolivela/my-portfolio-hub` — has git history and the GitHub remote.
  (`/Users/rolivela/Claudes Stuff` is a separate, unrelated working directory some past sessions
  started in by mistake — don't confuse the two.)
- **GitHub**: `https://github.com/RoliVela/my-portfolio-hub` (public repo, account `RoliVela`).
- **Hosting**: GitHub Pages, serving the `gh-pages` branch — **not Vercel** (explicitly chosen by
  the user). Deploys are static exports (`output: 'export'` in `next.config.mjs`, gated behind a
  `GITHUB_PAGES=true` env var so local `next dev` is unaffected).
- **Live URL**: https://rolivela.github.io/my-portfolio-hub/
- **CI**: `.github/workflows/deploy.yml` — on push to `main`, builds the static export and
  publishes it to `gh-pages` via `peaceiris/actions-gh-pages`. The `gh` CLI needs both `repo` and
  **`workflow`** OAuth scopes to push `.github/workflows/*.yml` changes — if pushing a workflow
  file change fails with a scope error, run `gh auth refresh -h github.com -s workflow`.
- **Critical hosting constraint**: because this is a static export, **Next.js Server Actions
  cannot run** (`'use server'` functions fail the build outright — confirmed by hitting this for
  real with an over-scoped suggestion-box feature that had to be reverted to client-only). Any
  future feature needing a real backend (Stripe payment, LLM API calls, emailing form
  submissions) needs either a static-safe third-party service called directly from the client
  (e.g. Formspree/EmailJS for forms) or a hosting change — don't add Server Actions here.
- Occasional GitHub-side `503` errors on the Pages-publish step are a known transient
  infrastructure hiccup (not our bug) — re-running the workflow clears it.

## Architecture

- Next.js 16 (App Router), Tailwind CSS, Framer Motion (added for the pick-up/inspect animation).
- `lib/roomData.ts` — the `RoomObject` data model and all 20 objects' dialogue/state/position/
  asset-path config. Key fields: `toggleKey` (state flipped on click), `imageSrc`/`imageSrcAlt`
  (swapped based on `altStateKey` or `toggleKey`), `position` (x/y/width/height as % of room).
- `app/page.tsx` — the main room component: renders the background, all object hitboxes, Snippy,
  dialogue boxes, and the pick-up/inspect flow state machine.
- `components/` — `SnippyCharacter`, `DialogueBox` (Undertale-style typewriter box, now also
  plays a quiet talk-sound while typing), `ItemInteractionStage` (the per-object mini-game
  dispatcher — add a new `case obj.id === 'OBJ_XX'` here for each custom interaction),
  `ClockOverlay`/`ClockInteraction`, `NeeDohInteraction`, `SuggestionBoxInteraction`, and others
  added over time.
- `?reposition` query param — a built-in dev tool (drag to move, drag corner handle to resize,
  numeric inputs, collapsible side panel, "Copy Data" button) for tuning object hitboxes visually
  instead of hand-editing percentages.

## Interaction flow (how clicking an object works)

`OBJ_01`/`OBJ_02` (Snippy himself) use a simple bottom dialogue box. Every other object
(`OBJ_03`–`OBJ_20`) uses a richer flow: click → item animates to screen center and enlarges
(Framer Motion `layoutId` shared-element transition) → backdrop dims → Snippy's dialogue plays →
an Undertale-style "Interact / Exit" choice prompt appears → Interact opens that object's
`ItemInteractionStage` case (custom mini-game, or a generic toggle-and-confirm fallback for
objects without one yet) → Exit animates back to the room.

## Known hitbox-sizing lesson (important, learned the hard way)

Object hitboxes are fit to the image's real aspect ratio via `getFittedStyle` in `app/page.tsx`,
which treats `position.width`/`height` as a **maximum bounding box**, not literal dimensions —
the actual rendered/clickable size is the largest rectangle matching the image's aspect ratio
that fits inside that box. Two consequences worth remembering:
1. If a hitbox still looks oversized after this system is working, the fix is almost always
   **shrinking the `position` data**, not the code — the fitting logic can't shrink a box that's
   uniformly too big in both dimensions, only correct a mismatched aspect ratio.
2. Sprite alpha-trimming (`scripts/trim-sprites.py`) only helps when there's real transparent
   padding to crop. Several images (Kermit, Nee-Doh, the boombox on/off pair) already have
   content spanning edge-to-edge (or, for on/off pairs, a combined bounding box that covers
   nearly the whole canvas) — trimming does nothing for those; it's a data-only fix.
3. There was also a real bug (fixed in commit `a281b43`/`f0f0b30`-era work) where cached images
   never fire `onLoad`, so the fit-to-aspect-ratio logic silently never engaged on repeat page
   loads. Fixed via a `ref` callback that checks `img.complete` as a fallback to `onLoad`.

## Object-by-object status (as of HEAD `8f2814b`)

All 20 objects have real pixel-art sprites now (sourced from
`~/Claudes Stuff/Portfolio Images/`, generated externally by the user — not by Claude, no
image-gen tool is available in-session). Custom `ItemInteractionStage` cases exist for: Snippy
check-in (`OBJ_02`), Clock/timezone picker (`OBJ_14`), Nee-Doh drag-warp (`OBJ_15`), Suggestion
box (`OBJ_17`, client-only after the Server Action revert), and in-progress Polaroid board
(`OBJ_20`, uncommitted — see "Loose ends" below). Everything else still uses the generic
toggle-and-confirm fallback.

Simple on/off toggles (lights, blinds, coffee mug, etc.) are considered done/acceptable as-is per
explicit user sign-off ("the lights should obviously turn on and off and are fine for now").

## Loose ends / in-progress at last check

- **Uncommitted local changes** (not yet pushed as of this writing):
  `components/ItemInteractionStage.tsx`, `components/NeeDohInteraction.tsx` (mid-rewrite of the
  mesh-warp, reason unclear — verify it still works before trusting it, or revert to the
  `8f2814b` version which was confirmed working via a correct triangle-affine-transform clip-path
  fix), and a new untracked `components/PosterboardInteraction.tsx` (unfinished, not yet wired
  into `ItemInteractionStage.tsx`).
- An autonomous multi-section prompt was just handed off covering: finishing/resolving the above,
  trimming Nee-Doh/Boombox hitboxes (data-only, see above), tilting the clock's live-time overlay
  to match `clock.png`'s isometric angle, a Dead-by-Daylight-style watering mini-game shared
  across Monstera/Snake Plant/Senecio Rowleyanus (explicitly **not** Venus Fly Trap, which uses a
  different `isFed` state), a real functioning calculator, a window-blinds dialogue fix (only
  show the "aww shucks" line once actually closed, not right after the open-view line), and a
  playable Chrome-Dino-style game on the locked Computer. Check `git log` since `8f2814b` to see
  how far it got.

## Explicitly future / not-yet-built

- Global state + `localStorage` persistence (state currently resets on page reload — was in the
  original architecture spec, never implemented).
- Computer payment gating (Stripe or hidden bypass code via the calculator) — the calculator
  interaction table mentions a hidden code but no code/logic has ever been defined; don't invent
  one without the user's input.
- Real LLM (NVIDIA NIM) wiring for paid-tier Snippy chat + rate-limit "circuit breaker" UI —
  currently Snippy only ever uses the static free-tier dialogue script.
- Kermit's actual "pet the cat" mini-game (currently flavor dialogue only).

## Persona note

Snippy's dialogue should read Olaf-inspired (naive, warm, hyper-enthusiastic) — a past instruction
mentioned "sounds like Tom Nook" but that was about vocal delivery/cadence only, not the core
personality, which stays Olaf. Don't overcorrect toward a shrewd/transactional Tom Nook tone.
