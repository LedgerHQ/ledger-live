# live-env

`@ledgerhq/live-env` centralizes all runtime environment variables and configuration flags for Ledger Live. It defines every env key with a typed default value and a description, and exposes a reactive API to read and override them at runtime — useful for debugging, testing, and feature toggling without a full rebuild.

## What it does

- Declares a typed registry (`envDefinitions`) of all supported env keys with defaults and parsers
- Provides `getEnv(key)` / `setEnv(key, value)` for safe, typed access
- Emits an RxJS `Subject` stream when a value changes, enabling reactive subscriptions
- Supports parsing from raw strings (e.g. process.env) with int/float/bool/JSON parsers

## Key exports / concepts

- `getEnv(name)` — read the current value of an env key (returns the typed default if not set)
- `setEnv(name, value)` — override a value at runtime
- `EnvName` — union type of all valid env key names
- `EnvValue<Name>` — inferred value type for a given key
- `changes$` — RxJS observable of `{ name, value }` for reactive env updates

## Usage context

Used across the entire monorepo (desktop, mobile, live-common, coin libs) wherever runtime configuration or debug flags are needed. Consumed at the top of app startup to apply env overrides from `process.env` and developer tooling.
