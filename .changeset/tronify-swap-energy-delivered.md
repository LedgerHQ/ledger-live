---
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

feat: add `custom.exchange.tronify.isEnergyDelivered` so the Swap live app can wait for rented TRON energy, and re-check a TRON swap fee shortfall against freshly synced native balances. Exchange wallet API errors now carry their code to the live app in `cause`.
