# live-hooks

`@ledgerhq/live-hooks` is a small collection of shared React hooks used across Ledger Live desktop and mobile. It centralises common UI performance patterns — debouncing and throttling — so they don't need to be re-implemented in each app.

## What it does

- Provides `useDebounce` to delay state updates until a value has stopped changing for a given interval, useful for search inputs and filter fields.
- Provides `useThrottledFunction` to limit how often a callback is invoked, useful for scroll handlers and frequent event sources.

## Key exports / concepts

- `useDebounce<T>(value: T, delay: number): T` — returns a debounced copy of `value`.
- `useThrottledFunction(fn, delay)` — returns a throttled version of `fn`.

## Usage context

Used by both `apps/ledger-live-desktop` and `apps/ledger-live-mobile` wherever input debouncing or handler throttling is needed. No dependencies on platform-specific APIs; works in any React environment.
