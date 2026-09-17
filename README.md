# Knurl OS

Local-first strength telemetry for Knurl. Load, rest, inventory, and a vault that never leaves the device.

There is no account and no cloud sync. If the network is down, the session is not.

## Architecture

```
src/
  routes/                 TanStack file routes (Command, Session, Logbook, …)
  components/             Shell, knurl mark, plate stack, shadcn-styled primitives
  lib/domain/             Pure engines: 1RM, plates, warm-up, volume, CSV, records
  lib/storage/            Dexie IndexedDB + repository interface (vault)
  lib/store/              Zustand: rest clock, drafts, prefs
  lib/brand/              Tokens and manifesto copy
  lib/platform/           Rest chime and vibration (device-local, no telemetry)

```

- **UI:** React 19, TanStack Start/Router, Tailwind v4, Zustand.
- **Vault:** Dexie (IndexedDB) behind `src/lib/storage/repo.ts`. Swap the repository later for native SQLite via Capacitor; engines do not import Dexie.
- **Validation:** Zod schemas in `src/lib/domain/schema.ts` (entities, prefs, vault dump).
- **Charts:** Recharts, mill/chalk/oxide tokens only.
- **PWA:** Platform service worker + install path. Fully usable offline after first load.
- **Auth/network:** none. No analytics scripts. No remote APIs.

Canonical storage is always kilograms (and centimetres for girth). Display units are a preference.

## Deploy on Railway

Knurl OS is local-first: Railway only hosts the app. The vault stays in the visitor's browser. Do not add Postgres or auth.

The repo is already wired for Railway ([motivatedc-creator/knurl-os](https://github.com/motivatedc-creator/knurl-os)).

1. Sign in at [railway.com](https://railway.com).
2. **New Project → Deploy from GitHub repo**.
3. Authorize GitHub if asked, then pick **knurl-os**.
4. Wait for the first deploy to go green.
5. Open the service → **Settings → Networking → Generate Domain**.
6. Visit that URL. First load seeds the catalog on that device.

Optional:

- Custom domain: same Networking page → **Custom Domain**.
- Pull-request previews: enable them on the service if you want a mill-scale check per PR.
- Variables: none required. Do not set `PORT`. Railway provides it. `HOST=::` is already in `railway.toml`.

If a deploy fails on a fork without `railway.toml`, set:

- **Build command:** `NITRO_PRESET=node-server npm run build`
- **Start command:** `HOST=:: node .output/server/index.mjs`

## Local setup

```bash
npm install
npm run dev          # app at 0.0.0.0:8080
```

First launch seeds an 80-movement catalog, four templates (Lower A/B, Upper A/B), a kg plate inventory, and mill-theme prefs.

## Tests

```bash
npm run test:unit    # Vitest — 1RM, plates, warm-up, volume, CSV, streak, records
npm run test:e2e     # Playwright critical path
npm run typecheck
npm run lint
```

Unit engines live next to the code as `src/lib/domain/*.test.ts`.

E2E (`e2e/critical-path.spec.ts`): create a routine → log a set with plate math → refresh → close the session → assert personal-record summary → assert analytics tonnage.

## Domain engines

| Module | Contract |
|---|---|
| `one-rm.ts` | Epley `w*(1+r/30)`; Brzycki `w*36/(37-r)` with `r ≥ 37` falling back to Epley; warm-ups ignored. |
| `plates.ts` | Greedy heavy-first, even counts only, heaviest inside. Inexact targets report closest lower load and delta. |
| `warmup.ts` | Bar×8, 50%×5, 70%×3, 85%×2, 90%×1 (heavy ≥ 80 kg). Monotonic, de-duplicated, rounded to inventory. |
| `volume.ts` | `weight × reps`; primary 1.0, secondary configurable (default 0.5). |
| `records.ts` | Heaviest, e1RM, set volume, and rep-bracket PRs. Warm-ups ignored. |
| `csv.ts` | Strong-style header auto-map, quoted-comma parse, rest-timer skip, formula-safe cells, fingerprints. |

## Capacitor packaging

`capacitor.config.json` points `webDir` at `dist`.

```bash
npm run build
# If the Start/Nitro build emits `.output/public` instead of `dist`,
# copy or retarget webDir before adding platforms.
npx cap add ios
npx cap add android
npx cap copy
npx cap open ios
```

Native SQLite: implement `StrengthRepository` on Capacitor SQLite with the same method names as `vault` in `src/lib/storage/repo.ts`. Domain engines stay untouched.

## Vault format

JSON export (`/vault`) is `{ schemaVersion, exportedAt, brand: "knurl-os", …tables }`. Current version is `1`. Restore is transactional and rejects a newer schema. Merge keeps existing ids; replace overwrites the local vault.

## Brand

See [BRAND.md](./BRAND.md) for naming, mark geometry, tokens, voice, and Iron/Hall/Academy standards.
