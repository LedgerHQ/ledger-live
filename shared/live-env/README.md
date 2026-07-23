# @shared/live-env

Workspace-private DDD layer for Ledger Live environment variables.

## What it is

In this PR, `@shared/live-env` is a typed re-export of `@ledgerhq/live-env`:

```ts
export * from "@ledgerhq/live-env";
```

All consumer packages inside `ledger-live` import env utilities from this package instead of directly from `@ledgerhq/live-env`. This makes PR 2 (which makes `@ledgerhq/live-env` type-lossy and moves all definitions here) a drop-in change with no consumer edits.

## Usage

```ts
import { getEnv, setEnv, setEnvUnsafe, EnvName, changes } from "@shared/live-env";
```

```ts
// React hook — via @features/platform-env
import useEnv from "@features/platform-env";
```

## Who can import this

- `apps/*` and `shared/*` packages: may import at runtime.
- Private `libs/*` packages (`"private": true`): may import in test setup files (as a devDependency side-effect).
- Published `libs/*` packages: must use `@ledgerhq/live-env` directly — `@shared/live-env` is not published to npm.
