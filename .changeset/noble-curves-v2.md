---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/coin-zcash": minor
"@ledgerhq/hw-app-btc": major
"@ledgerhq/hw-app-exchange": minor
"@ledgerhq/wallet-btc": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-tester-bitcoin": minor
"@ledgerhq/coin-tester-kaspa": minor
"@ledgerhq/coin-tester-stellar": minor
"@ledgerhq/coin-tester-tezos": minor
"@ledgerhq/coin-tester-tron": minor
"@ledgerhq/coin-tester-zcash": minor
"@features/platform-app-update": minor
---

Bump `@noble/curves` to 2.4.0 (ESM-only), use the `.js` subpaths and pass `prehash: false` where a digest is signed or verified. CommonJS consumers of `@ledgerhq/hw-app-btc` and `@ledgerhq/wallet-btc` now need Node >= 20.19 (synchronous `require(esm)`) or an ESM-capable bundler.
