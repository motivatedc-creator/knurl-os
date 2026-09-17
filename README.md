# Knurl OS

Local-first strength telemetry for Knurl. Load, rest, inventory, and a vault that never leaves the device.

There is no account and no cloud sync. If the network is down, the session is not.

## Architecture

```
src/
  routes/                 TanStack file routes (Command, Session, Logbook, …)
  components/             Shell, knurl mark, plate stack, shadcn-styled primitives
  lib/domain/             Pure engines: 1RM, plates, warm-up, volume, CSV
  lib/storage/            Dexie IndexedDB + repository interface (vault)
  lib/store/              Zustand: rest clock, drafts, prefs
  lib/brand/              Tokens and manifesto copy
```

- **UI:** React 19, TanStack Start/Router, Tailwind v4, Zustand.
- **Vault:** Dexie (IndexedDB) behind `src/lib/storage/repo.ts`. Swap the repository later for native SQLite via Capacitor; engines do not import Dexie.
- **Validation:** Zod schemas in `src/lib/domain/schema.ts` (entities, prefs, vault dump).
- **Charts:** Recharts, mill/chalk/oxide tokens only.
- **PWA:** Platform service worker + install path. Fully usable offline after first load.
- **Auth/network:** none. No analytics scripts. No remote APIs.

Canonical storage is always kilograms (and centimetres for girth). Display units are a preference.

## Local setup

```bash
npm install
npm run dev          # app at 0.0.0.0:8080
```

First launch seeds an 80-movement catalog, four templates (Lower A/B, Upper A/B), a kg plate inventory, and mill-theme prefs.

## Tests

```bash
npm run test:unit    # Vitest — 1RM, plates, warm-up, volume, CSV, streak
npm run test:e2e     # Playwright critical path
npm run typecheck
npm run lint
```

Unit engines live next to the code as `src/lib/domain/*.test.ts`.

E2E (`e2e/critical-path.spec.ts`): create a routine → log a set with plate math → refresh → close the session → assert analytics tonnage.

## Domain engines

| Module | Contract |
|---|---|
| `one-rm.ts` | Epley `w*(1+r/30)`; Brzycki `w*36/(37-r)` with `r ≥ 37` rejected; warm-ups ignored. |
| `plates.ts` | Greedy heavy-first, even counts only, heaviest inside. Inexact targets report closest lower load and delta. |
| `warmup.ts` | Bar×8, 50%×5, 70%×3, 85%×2, 90%×1 (heavy ≥ 80 kg). Monotonic, de-duplicated, rounded to inventory. |
| `volume.ts` | `weight × reps`; primary 1.0, secondary configurable (default 0.5). |
| `csv.ts` | Strong-style header auto-map, quoted-comma parse, row faults, fingerprints for duplicates. |

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

JSON export (`/vault`) is `{ schemaVersion, exportedAt, brand: "knurl-os", …tables }`. Current version is `1`. Restore is transactional and rejects a newer schema.

## Brand

See [BRAND.md](./BRAND.md) for naming, mark geometry, tokens, voice, and Iron/Hall/Academy standards.
