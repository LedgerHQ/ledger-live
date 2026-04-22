# Future: async `import()` for code splitting

## Current approach

Loaders use synchronous `require()` calls (see `loaders.ts`). This keeps the entire registry API
synchronous — `getCurrencyBridge`, `getAccountBridge`, `fromTransactionRaw`, etc. remain plain
functions, not `Promise`-returning ones. No async propagation into React hooks or existing call
sites.

`require()` is lazy in Node.js (first call loads the module, subsequent calls hit the module
cache), and bundlers (webpack/Metro/rspack) treat it as a module factory that only executes on
first call — so execution is deferred even though there is no code splitting.

## Long-term direction

Replacing `require()` with dynamic `import()` would unlock true **bundle splitting**: each coin
family becomes a separate async chunk loaded on demand, reducing the initial JS payload for web and
mobile apps.

A previous exploration of this direction is tracked in
[PR #16002](https://github.com/LedgerHQ/ledger-live/pull/16002). The main challenge is that
switching `load*ForFamily()` functions from `T` to `Promise<T>` is a breaking API change that
propagates async throughout the codebase (bridges, transaction helpers, React hooks, CLI commands,
…). This work was deferred in favour of the simpler synchronous approach shipped here.

## Migration path

When the team decides to move to async loaders:

1. Change `CoinModuleLoader.load*` signatures from `() => T` to `() => Promise<T>`.
2. Change `load*ForFamily()` registry functions to return `Promise<T>`.
3. Update every call site — bridges, `fromTransactionRaw`, `hw/getAddress`, `hw/signMessage`,
   wallet-api/platform converters — to `await` the loader.
4. Consider a one-time `preload()` at app startup to warm all families eagerly if code splitting
   is not desired for a particular surface.
