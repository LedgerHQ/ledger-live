# live-promise

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/live-promise` provides small, focused Promise utilities for Ledger Live. Rather than pulling in a heavy async library, it ships only the primitives the codebase actually needs: retrying, delaying, and composing async operations.

## What it does

- `retry(fn, options)` — retries an async function with configurable exponential back-off, max attempts, and a custom retry-condition predicate.
- `delay(ms)` — returns a Promise that resolves after `ms` milliseconds.

## Key exports / concepts

- `retry<A>(f: () => Promise<A>, options?)` — `maxRetry`, `interval`, `intervalMultiplicator`, `retryCondition`.
- `delay(ms: number): Promise<void>`.

## Usage context

Used throughout `libs/ledger-live-common` and coin modules wherever network calls or device commands need automatic retry logic. Zero runtime dependencies beyond the standard Promise API.
