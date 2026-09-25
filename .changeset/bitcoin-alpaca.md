---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/wallet-btc": patch
---

Add the Alpaca `CoinModuleApi` surface to coin-bitcoin (`createApi`) for the native BTC / xpub (descriptor) account model — `getBalance`, `lastBlock`, `listOperations`, `craftTransaction`, `estimateFees`, `combine`, `broadcast`, `validateIntent`, `validateAddress` — alongside the unchanged legacy bridge.

wallet-btc no longer imports `@ledgerhq/logs`: its logger is now injected via constructor (no-op by default), so consumers pass their own `log`.
