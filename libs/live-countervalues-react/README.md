# live-countervalues-react

> [!WARNING]
> **Status: DEPRECATED** — This package is now private and will not receive further npm releases.
> It is being replaced by `@domain/` packages as part of the Ledger Live DDD migration.
> In-repo consumers continue to work; all new code should target the domain packages once available.

`@ledgerhq/live-countervalues-react` is the React layer over `@ledgerhq/live-countervalues`. It provides a context provider and hooks so that components can subscribe to fiat countervalue data without managing rate-fetching or caching themselves.

## What it does

- Wraps `live-countervalues` state into a React context
- Triggers periodic rate refresh and exposes polling state
- Provides hooks for per-amount fiat conversion and polling control

## Entry point

Everything is exported from the package root (`@ledgerhq/live-countervalues-react`):

| Export | Description |
|--------|-------------|
| `CountervaluesProvider` | Context provider; wrap the app root to enable countervalue hooks |
| `CountervaluesBridge` | Interface for the bridge object passed to the provider |
| `useCountervaluesState` | Returns the current `CounterValuesState` |
| `useCountervaluesPolling` | Returns polling state and control (`Polling` type) |
| `useCountervaluesUserSettings` | Returns the current `CountervaluesSettings` |
| `useCalculate` | Converts a crypto amount to fiat using current rates |
| `useCalculateCountervalueCallback` | Memoised callback version of `useCalculate` |
| `useSendAmount` | Converts send amounts between crypto and fiat |

## Usage context

Used in both Ledger Live Desktop and Mobile at the app root level. Any component that needs to show fiat-denominated amounts (balance, history charts, asset list rows) consumes a hook from this package.
