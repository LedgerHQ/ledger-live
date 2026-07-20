# @shared/live-env

Workspace-private DDD layer for Ledger Live environment variables.

## What it is

`@shared/live-env` owns all ~200 env var **definitions** and exposes a fully typed API over `@ledgerhq/live-env` (the framework layer).

Importing this package calls `injectDefinitions()` automatically, so any consumer that imports from `@shared/live-env` gets a fully initialised env system.

## Structure

```
shared/live-env/src/
  definitions/
    team-platform/                  EXPERIMENTAL_*, WALLETCONNECT, MOCK, service endpoints…
    team-coin-integration/          per-coin API endpoints (Algorand, Aptos, Bitcoin…)
    team-blockchain-support/        blockchain infra env vars
    team-ptx/                       swap/exchange env vars, FORCE_PROVIDER…
    team-engagement/                onboarding, analytics…
    team-wallet-xp/                 wallet UX, NFT, address poisoning…
    team-live-devices/              device-related flags
    team-qaa/                       QA/testing flags
    team-ledger-partner-hoodies/    partner integration vars
    team-ledger-partner-blockydevs/ partner integration vars
    index.ts                merges all teams into `allDefinitions`
  index.ts                  calls injectDefinitions + exports typed API
```

## Usage

```ts
import { getEnv, setEnv, setEnvUnsafe, EnvName, EnvValue, changes } from "@shared/live-env";

// Fully typed — getEnv returns the correct type for each key
const calUrl: string = getEnv("CAL_SERVICE_URL");
const mockSeed: string = getEnv("MOCK");
```

```ts
// React hook — via @features/platform-env
import useEnv from "@features/platform-env";
```

## Who can import this

- `apps/*` — all app entrypoints
- `shared/*` — other shared DDD layers
- Private `libs/*` (those with `"private": true`) — test setups and internal libs
- Published `libs/*` — **test setup only** (as a `devDependency`): add `require("@shared/live-env")` in `jest.setup.js` so `injectDefinitions()` is called before tests that call `getEnv`. Runtime source must still use `@ledgerhq/live-env` directly.
