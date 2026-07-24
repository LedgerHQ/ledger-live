# live-network

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/live-network` is the shared network layer for Ledger Live. It wraps the underlying HTTP client with Ledger-specific logging, error normalisation, and request optimisation utilities so all services in the monorepo make network calls consistently.

## What it does

- Exposes a `network()` helper that wraps `axios` with automatic logging (via `@ledgerhq/logs`) and maps HTTP errors into typed Ledger errors.
- Provides a **request batcher** (`batcher/`) that coalesces concurrent requests for the same resource into a single in-flight call, reducing redundant network traffic.
- Provides a **cache layer** (`cache.ts`) for memoising responses with configurable TTL.

## Key exports / concepts

- Default export `network(options)` — drop-in replacement for `axios` with logging and error handling.
- `seconds(n) / minutes(n) / hours(n)` — helpers that produce `CacheOptions` for use with `lru-cache`.
- `makeBatcher(request, params)` — batches concurrent calls within the same event-loop tick into a single upstream request (via `@ledgerhq/live-network/batcher`).

## Usage context

Used throughout `libs/ledger-live-common`, coin modules, and service clients. Both desktop and mobile depend on it transitively. It is the single place to configure global request behaviour (timeouts, base URLs via `@ledgerhq/live-env`).
