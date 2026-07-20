# live-env

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/live-env` is the **framework** for typed runtime environment variables in Ledger Live. It exposes a reactive API (`getEnv`, `setEnv`, `changes`) but ships **no env-var definitions** — those live in the workspace-private `@shared/live-env` layer inside the monorepo.

## What it does

- Provides `getEnv(key)` / `setEnv(key, value)` for safe, typed access
- Emits a reactive stream (`changes`) when a value changes, enabling subscriptions
- Supports parsing from raw strings (e.g. `process.env`) with int/float/bool/JSON parsers
- Enforces initialization: every API throws until `injectDefinitions()` has been called

## Key exports / concepts

- `injectDefinitions(defs)` — must be called **once** before any other API, with a record of `EnvDef` entries
- `getEnv(name)` — read the current value of an env key
- `setEnv(name, value)` — override a value at runtime
- `setEnvUnsafe(name, rawString)` — parse and set from a raw string (e.g. `process.env`)
- `changes` — observable of `{ name, value, oldValue }` for reactive env updates

## Usage inside the Ledger Live monorepo

Internal packages import from `@shared/live-env`, which calls `injectDefinitions()` at module load and re-exports a fully typed API. You do not need to call `injectDefinitions()` yourself.

```ts
import { getEnv, setEnv, changes } from "@shared/live-env";

const timeout = getEnv("GET_CALLS_TIMEOUT"); // number
setEnv("MOCK", true);
changes.subscribe(({ name, value }) => console.log(name, value));
```

## Usage outside the Ledger Live monorepo

External consumers must supply their own definitions and call `injectDefinitions()` before any `getEnv`/`setEnv` call. The API will throw if called before initialization.

```ts
import {
  injectDefinitions,
  getEnv,
  setEnv,
  changes,
  intParser,
  boolParser,
  stringParser,
} from "@ledgerhq/live-env";

// 1. Define your env vars
const myDefinitions = {
  MY_TIMEOUT: {
    def: 30_000,
    parser: intParser,
    desc: "Request timeout in ms",
  },
  MY_DEBUG: {
    def: false,
    parser: boolParser,
    desc: "Enable debug logging",
  },
  MY_API_URL: {
    def: "https://api.example.com",
    parser: stringParser,
    desc: "Base API URL",
  },
} as const;

// 2. Inject once at app startup, before any imports that call getEnv
injectDefinitions(myDefinitions);

// 3. Use the API
const timeout = getEnv("MY_TIMEOUT"); // unknown at framework level — cast as needed
setEnv("MY_DEBUG", true);
changes.subscribe(({ name, value }) => console.log(`${name} changed to`, value));
```

> [!IMPORTANT]
> `injectDefinitions()` must be called **before** any module that calls `getEnv` or `setEnv` is evaluated. Place it at the very top of your application entry point, before other imports that may trigger env reads.
