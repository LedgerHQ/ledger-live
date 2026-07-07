# live-countervalues-react

`@ledgerhq/live-countervalues-react` is the React layer over `@ledgerhq/live-countervalues`. It provides a context provider and hooks so that components can subscribe to fiat countervalue data without managing rate-fetching or caching themselves.

## What it does

- Wraps `live-countervalues` state into a React context
- Triggers periodic rate refresh and exposes loading state
- Provides portfolio valuation hooks for per-account and total-balance fiat display

## Key exports / concepts

- `CountervaluesProvider` — context provider; wrap the app root to enable countervalue hooks
- `useCountervaluesState` — returns the current `CountervaluesState`
- `usePortfolioState` — computes fiat portfolio value for a set of accounts
- `portfolio.tsx` — portfolio-level valuation hook with memoized selectors

## Usage context

Used in both Ledger Live Desktop and Mobile at the app root level. Any component that needs to show fiat-denominated amounts (balance, history charts, asset list rows) consumes a hook from this package.
