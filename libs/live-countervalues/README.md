# live-countervalues

> [!WARNING]
> **Status: DEPRECATED** — This package is now private and will not receive further npm releases.
> It is being replaced by `@domain/` packages as part of the Ledger Live DDD migration.
> In-repo consumers continue to work; all new code should target the domain packages once available.

`@ledgerhq/live-countervalues` manages fiat (and cross-crypto) exchange rate fetching, caching, and portfolio valuation for Ledger Live. It fetches rates from Ledger's countervalues API and exposes pure functions to convert crypto amounts to fiat at any point in time.

## What it does

- Fetches exchange rates for crypto/fiat pairs from Ledger's API (`api/`)
- Caches rates with time-bucketing to avoid redundant requests
- Computes fiat-denominated valuations of crypto amounts
- Provides mock data generators for tests
- Exposes rate interpolation and rounding helpers

## Entry points

| Subpath | Contents |
|---------|----------|
| `@ledgerhq/live-countervalues/types` | `CountervaluesSettings`, `CounterValuesState`, `CounterValuesStateRaw`, `TrackingPair`, `CounterValuesAPI`, `CounterValuesStatus`, and related types |
| `@ledgerhq/live-countervalues/logic` | `calculate`, `calculateMany`, `loadCountervalues`, `importCountervalues`, `exportCountervalues`, `initialState`, `inferTrackingPairForAccounts`, `filterSupportedTrackingPairs`, and related functions |
| `@ledgerhq/live-countervalues/helpers` | `pairId`, `inferCurrencyAPIID`, `formatCounterValueDay`, `formatCounterValueHour`, and related utilities |
| `@ledgerhq/live-countervalues/mock` | `getBTCValues`, `TICKER_TO_ID_AND_VALUE` — test fixtures |
| `@ledgerhq/live-countervalues/api` | Default export: the `CounterValuesAPI` implementation (switches between prod and mock via `MOCK_COUNTERVALUES` env var) |

## Usage context

Used by both Desktop and Mobile. The state is managed in Redux and seeded via `loadCountervalues`. `live-countervalues-react` wraps this for React component consumption.
