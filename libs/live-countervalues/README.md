# live-countervalues

`@ledgerhq/live-countervalues` manages fiat (and cross-crypto) exchange rate fetching, caching, and portfolio valuation for Ledger Live. It fetches rates from Ledger's countervalues API and exposes pure functions to convert crypto amounts to fiat at any point in time.

## What it does

- Fetches exchange rates for crypto/fiat pairs from Ledger's API (`api/`)
- Caches rates with time-bucketing to avoid redundant requests
- Computes portfolio valuations: per-account balance in fiat, total portfolio value
- Provides mock data generators for tests
- Exposes rate interpolation and rounding helpers

## Key exports / concepts

- `CountervaluesAPI` — the data-fetching layer (rate queries, batch requests)
- `logic` — pure functions: `calculateCounterValue`, `inferCounterValue`
- `portfolio` — functions to compute fiat valuation across a list of accounts
- `CountervaluesState` — the shape of the cached rate store
- `CountervaluesPair` — `{ from: Currency, to: Currency }` rate pair type

## Usage context

Used by both Desktop and Mobile. The state is managed in Redux (or equivalent) and seeded from `portfolio.ts`. `live-countervalues-react` wraps this for React component consumption.
