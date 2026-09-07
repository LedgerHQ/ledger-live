# Migrating off `@ledgerhq/live-env`

> [!WARNING]
> **`@ledgerhq/live-env` is deprecated.** Do not add definitions, do not add call sites.
> This guide is how you take an existing one out.

## Why

The framework is fine; the injection is the problem. `injectDefinitions()` registers a global
mutable singleton, and everything downstream inherits it:

- every consumer of a shared library must inject, or `getEnv` throws
- a value read through a global is invisible in the dependency graph — nothing tells you a library
  needs it until it fails at runtime
- it duplicates three mechanisms that already exist: feature flags, build-time constants, and
  `process.env`

## The four exits

Every variable leaves by exactly one of these. Pick by asking what the value actually does, not by
what is easiest to type.

| The value…                 | Replacement                       | Why                              |
| -------------------------- | --------------------------------- | -------------------------------- |
| is togglable remotely      | **feature flag**                  | already remote, typed, audited   |
| never varies at runtime    | **inline constant**               | the dependency leaves the graph  |
| varies in CI / tests / dev | **`process.env` at the use site** | no registry, no injection        |
| varies per app             | **passed in as a parameter**      | the app owns state, not the lib  |

If two look plausible, prefer the one further down the table: it removes more machinery.
If none fit, that is a signal worth raising, not a blocker.

---

### 1. Togglable remotely → feature flag

A value someone wants to flip without a release is a feature flag. Often the flag already exists
and the env var is just the fallback nobody deleted — check before writing a new one.

```diff
- import { getEnv } from "@ledgerhq/live-env";
-
- if (!feature?.enabled) return getEnv("ENABLE_THING").split(",");
- return feature?.params?.things ?? null;
+ return feature?.params?.things ?? null;
```

Outside React, the flag reaches you through the config your composition root already builds — not
through a second global.

### 2. Never varies at runtime → inline constant

If nothing calls `setEnv` on it and no bootstrap overrides it, it is a constant that has been
paying registry rent for years.

```diff
- import { getEnv } from "@ledgerhq/live-env";
- const version = () => getEnv("API_VERSION");
+ const API_VERSION = 2;
```

This is the exit that shrinks the dependency graph: the module stops importing the library at all.

Two things make *every* variable look overridable, and neither should stop you: a bootstrap that
loops `process.env` into `setEnvUnsafe`, and any debug UI that can set a variable by name. Those
are generic escape hatches, not evidence that a value varies. Ask whether a *product* path sets it.

### 3. Varies in CI / tests / dev → `process.env` at the point of use

Read it where you need it and parse it there. No registry entry, no injection, no import ordering.

```diff
- import { getEnv } from "@ledgerhq/live-env";
- setDecimalPlaces(getEnv("DECIMAL_PLACES"));
+ const decimalPlaces = Number.parseInt(process.env.DECIMAL_PLACES ?? "", 10);
+ setDecimalPlaces(Number.isNaN(decimalPlaces) ? 40 : decimalPlaces);
```

Keep the default at the use site, as above.

> [!CAUTION]
> **Do not fall back with `||`.** `Number(process.env.X) || 40` looks equivalent and is not: it
> swallows a legitimate `0`, and `false` for booleans. `intParser` returns `0` for `X=0` today, so
> `||` silently changes behaviour for anyone who set it. Test against `Number.isNaN`, or `??` over
> an already-parsed value. This is the most likely way to introduce a bug while migrating.

Where `process.env` is not populated the way it is under Node — a React Native app, a bundler
target — use that platform's existing accessor. The point of the exit is unchanged: the value stops
travelling through a singleton.

### 4. Varies per app → passed in as a parameter

The app knows things a library cannot. Take the value as an argument. Do not store it.

Replacing `getEnv` with a module-level `let` and a `configure()` is the same anti-pattern one size
down — still global, still mutable, still absent from the signature, still order-dependent at
import time. Runtime state is the end app's responsibility; a library receives what it needs.

```diff
  // library
- import { getEnv } from "@ledgerhq/live-env";
-
- export function fetchThing(id: string) {
-   return request(`${getEnv("API_URL")}/things/${id}`);
- }
+ export function fetchThing(ctx: { apiUrl: string }, id: string) {
+   return request(`${ctx.apiUrl}/things/${id}`);
+ }
```

Where several values travel together, group them into one context object threaded as the first
argument rather than growing the parameter list.

The signature is the whole point. A caller cannot forget the value, a test supplies a different one
without touching global state, and two callers can use two different values at the same time —
none of which a singleton allows.

If the library already has a `setX()`/`configure()`, moving a variable into it is a shorter step
than staying, but it is not the destination. Prefer the parameter.

Two things to get right:

- **A value the user can change is app state.** The library does not subscribe to it; the app
  re-reads its own store and passes the current value on the next call.
- **Migrate the whole bridge, not one key.** Where a setup function copies several variables into a
  library, taking one of them out and leaving the call silently drops the rest.

**Backend URLs deserve extra care.** Do not inline an endpoint where the `getEnv` used to be — that
scatters one backend's address across every file that talks to it, which is the same mistake in a
new shape. Resolve it once, in the app, and pass it down with the rest of the context.
`_STAGING`/`_PROD` pairs are not two endpoints: they are one endpoint and an app-level choice of
which URL to pass.

---

## While the burn-down runs

- **Do not add a new definition.** A new value should be born in one of the four exits.
- **Do not add a new call site**, including in tests. In a test, set the value the way the
  production code will read it after the migration, not through `setEnv`.
- Migrating a variable means removing its definition in the same PR. A definition with zero call
  sites left is dead weight nobody will come back for.
- **Check for dead ones first.** A definition with no call sites anywhere is a deletion, not a
  migration.

## Done

`@ledgerhq/live-env` unpublished and deleted.
