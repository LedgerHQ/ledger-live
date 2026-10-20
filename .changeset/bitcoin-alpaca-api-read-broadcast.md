---
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/live-common": minor
---

feat(coin-bitcoin): add a stateless single-address alpaca api (balance, history, blocks, fees, crafting, combine, intent validation, broadcast) for every bitcoin-family currency, with the hw-app-btc createPaymentTransaction parameters of what it crafts; each currency's transaction and address format comes from its coin config; dash and qtum get an explicit explorerId. `validateAddress` moves to `@ledgerhq/coin-bitcoin/logic/validateAddress` (the root `@ledgerhq/coin-bitcoin/validateAddress` subpath is removed)
