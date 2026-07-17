# @shared/live-env

Workspace-private DDD layer for Ledger Live environment variables.

## What it is

This package wraps `@ledgerhq/live-env` (the type-lossy framework) and adds:

- **All env var definitions** (~200 vars), split by CODEOWNERS team
- **Typed API**: `getEnv<K>`, `setEnv<K>`, `EnvName`, `EnvValue<K>` inferred from the definitions
- **React hook**: `useEnv<K>` via `@features/platform-env`

`injectDefinitions(allDefinitions)` is called at module load, so importing `@shared/live-env` is the only setup needed.

## Usage

```ts
import { getEnv, setEnv, setEnvUnsafe, EnvName, changes } from "@shared/live-env";

// Fully typed — getEnv<K> returns the parser's output type
const url = getEnv("CAL_SERVICE_URL"); // string
const timeout = getEnv("GET_CALLS_TIMEOUT"); // number
```

```ts
// React hook — separate package for React-only consumers
import { useEnv } from "@features/platform-env";
const isMock = useEnv("MOCK"); // string (MOCK is a seed string)
```

## Who can import this

Only `apps/` and `shared/*` packages. Public `libs/` use `@ledgerhq/live-env` directly with `getEnv<T>` generics.

## Definitions structure

```
src/definitions/
  team-coin-integration/   # per-coin API endpoints
  team-blockchain-support/ # blockchain tooling
  team-platform/           # cloud-sync, trustchain, WalletConnect
  team-ptx/                # swap & exchange
  team-ledger-partner-*/   # partner integrations
  team-live-devices/       # device firmware & manager
  team-wallet-xp/          # wallet UX features
  team-engagement/         # engagement features
  team-qaa/                # QA & test helpers
  index.ts                 # aggregates all teams
```
