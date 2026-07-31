---
name: errors
description: |
  How to define and check error classes in Ledger Live. Read when adding a new
  error, creating an errors.ts file, or checking an error's type.
globs: ["**/errors.ts", "**/errors/**/*.ts"]
---

# Errors

Each package owns its errors in its own `src/errors.ts`, as plain native classes.
There is no shared errors lib: no workspace package may depend on `@ledgerhq/errors`,
and the `enforce-boundaries` CI check fails on any manifest that does. It only still
lives here to keep being published for external consumers (see its `DEPRECATED.md`).

## Define errors

A package groups its errors in `src/errors.ts`. Extend `Error` directly and set a
stable `name`. The `name` string is the contract — keep it stable, it is what
survives across process/serialization boundaries.

```ts
// message-only
export class FooNotFound extends Error {
  override name = "FooNotFound";
}

// with a default message
export class InvalidChallenge extends Error {
  override name = "InvalidChallenge";
  constructor() {
    super("backend returned an invalid challenge");
  }
}

// with extra fields
export class HttpError extends Error {
  override name = "HttpError";
  readonly status: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}
```

Group a family under a per-package base class so callers can catch the whole set:

```ts
export class WalletAuthError extends Error {
  override name = "WalletAuthError";
}
export class WalletAuthSignatureError extends WalletAuthError {
  override name = "WalletAuthSignatureError";
  constructor(cause: unknown) {
    super("failed to sign challenge", { cause });
  }
}
```

See `libs/ledger-auth/src/errors.ts` for a full reference.

### `cause`

Use the native second argument: `super(message, { cause })`. Error `cause` was
standardized in ES2022 and is supported by modern runtimes; its TypeScript typing
(`ErrorOptions`) requires `lib: es2022.error` (i.e. `es2022`). Coin modules and
some older packages still target `es2020` — there, declare and assign manually:

```ts
export class BroadcastError extends Error {
  override name = "BroadcastError";
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
```

## Check error type: prefer `error.name`

Prefer `error.name === "FooNotFound"` over `instanceof FooNotFound`.

`instanceof` breaks once an error crosses a boundary — desktop/mobile IPC, worker
messaging, or the external `@ledgerhq/coin-module-framework` — because the object
is rebuilt and loses its prototype. The `name` string always survives.

```ts
// ✅ survives serialization
if (error instanceof Error && error.name === "FooNotFound") { … }

// ⚠️ only works in-process, before any serialization
if (error instanceof FooNotFound) { … }
```

Use `instanceof` only when you are certain the error has not crossed a boundary
(e.g. caught in the same module that threw it) and you need the typed fields.

## Where errors live

- Logic in one package → that package's `src/errors.ts`.
- Used only by an app → the app's `src/errors.ts` (`apps/ledger-live-desktop`,
  `apps/ledger-live-mobile`).
- Shared by several coin modules → `libs/ledger-wallet-framework/src/errors.ts`
  (`@ledgerhq/ledger-wallet-framework/errors`), the shared home below the coin layer.
