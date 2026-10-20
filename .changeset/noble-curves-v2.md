---
"@ledgerhq/coin-bitcoin": patch
"@ledgerhq/coin-zcash": patch
"@ledgerhq/hw-app-btc": major
"@ledgerhq/hw-app-exchange": patch
"@ledgerhq/wallet-btc": minor
"@ledgerhq/live-common": patch
"@ledgerhq/coin-tester-bitcoin": patch
"@ledgerhq/coin-tester-kaspa": patch
"@ledgerhq/coin-tester-stellar": patch
"@ledgerhq/coin-tester-tezos": patch
"@ledgerhq/coin-tester-tron": patch
"@ledgerhq/coin-tester-zcash": patch
"@features/platform-app-update": patch
---

Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.
