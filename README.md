# Flop Machine

> Professor Smith's Billion-Dollar AI Business Generator — an 80s-arcade slot-machine satire of AI VC hype.

Spin three reels, get a deliberately absurd AI startup premise, watch it pitch itself to a fake VC, raise a fake round, and exit in a blaze of shame. Captured ideas live in The Vault.

The point isn't the ideas. The point is the *reactions* the ideas provoke — that's where the real raw material lives. See [docs/01-genesis.md](docs/01-genesis.md) for the design thesis.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS for the arcade-retro look
- [Tone.js](https://tonejs.github.io/) for the slot-machine clack, ascending dings, and cha-ching arpeggio
- No backend. Everything runs in the browser; The Vault persists to `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Other scripts

- `npm run build` — typecheck and produce a production build in `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — TypeScript only, no emit
- `npm run lint` — ESLint with zero-warning policy

## Deploy

Configured for Netlify via [netlify.toml](netlify.toml) — push to `main` and Netlify builds with `npm run build` and publishes `dist/`.

## Project layout

```
src/
  App.tsx              -- the whole game in one file
  components/Reel.tsx  -- a single slot reel
  data/                -- content pools (audiences, problems, twists, VC firms, term sheets, etc.)
  lib/
    gameLogic.ts       -- spin / pitch / raise / exit state machine
    shareGrid.ts       -- emoji-grid share card generation
    types.ts           -- Phase + Reels + PitchedIdea + RaisedRound + ExitedStartup
  hooks/useSounds.ts   -- Tone.js synth setup, gated on first user gesture
content/pools.md       -- reference doc for the content pools
docs/                  -- design journal: genesis story + v1 prototype
```

## Credits

Bungee + IBM Plex Mono via Google Fonts. Sound design via Tone.js. Everything else is a satirical work of fiction; any resemblance to actual VC firms, founder quotes, or term sheets is intentional and affectionate.

Professionally terrible ideas since 2026.
