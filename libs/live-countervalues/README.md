# live-countervalues

> [!WARNING]
> **Status: DEPRECATED** — This package is now private and will not receive further npm releases.
> It is being replaced by `@domain/` packages.
> In-repo consumers continue to work; all new code should target the domain packages once available.

`@ledgerhq/live-countervalues` holds the fiat (and cross-crypto) exchange rate state for Ledger Live, and the pure functions that convert crypto amounts to fiat at any point in time. Fetching rates lives in `@domain/api-market-countervalues`.

## What it does

- Caches rates with time-bucketing
- Computes fiat-denominated valuations of crypto amounts
- Provides mock data generators for tests
- Exposes rate interpolation and rounding helpers

## Entry points

| Subpath | Contents |
|---------|----------|
| `@ledgerhq/live-countervalues/types` | `CountervaluesSettings`, `CounterValuesState`, `CounterValuesStateRaw`, `TrackingPair`, `CounterValuesStatus`, and related types |
| `@ledgerhq/live-countervalues/logic` | `calculate`, `calculateMany`, `importCountervalues`, `exportCountervalues`, `initialState`, `filterSupportedTrackingPairs`, and related functions |
| `@ledgerhq/live-countervalues/helpers` | `pairId`, `inferCurrencyAPIID`, `formatCounterValueDay`, `formatCounterValueHour`, and related utilities |
| `@ledgerhq/live-countervalues/mock` | `getBTCValues`, `TICKER_TO_ID_AND_VALUE` — test fixtures |

## Usage context

Used by both Desktop and Mobile. The state is managed in Redux and seeded via `loadCountervalues` from `@domain/api-market-countervalues`. `live-countervalues-react` wraps this for React component consumption.
