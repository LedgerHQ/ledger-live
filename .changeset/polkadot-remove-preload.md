---
"@ledgerhq/coin-polkadot": minor
"@ledgerhq/live-common": minor
---

Remove the deprecated `CurrencyBridge.preload`/`hydrate` from `coin-polkadot`. Polkadot validators, staking progress and minimum bond balance are now fetched on demand (with LRU caching in the network layer) instead of being eagerly preloaded at app init, which was slowing down the scan-account flow.

Also drop the mocked desktop E2E spec `tests/specs/families/polkadot.spec.ts` (with its snapshot and the `1AccountDOT` userdata it was the sole consumer of). It could only ever get validators through `hydrate`: under `MOCK` the bridge returns the mock currency bridge before `loadSetupForFamily`, so no coin config is registered and the on-demand fetch throws `MissingCoinConfig` before any HTTP request exists to intercept. The on-demand path is covered instead by `coin-polkadot/src/network/index.integ.test.ts`, and validator resolution was verified end to end in the real (non-mock) desktop app.
