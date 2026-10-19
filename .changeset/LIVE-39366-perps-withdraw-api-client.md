---
"@ledgerhq/live-common": minor
---

Add the SwapKit withdraw API client and the `custom.perps.withdraw` wallet API method for Perps. Withdraw quotes use the existing swap quotes endpoint (`swapkit_hyperliquid`) and withdraw destinations come from swap's supported currencies.

Perps deposit modules moved: `wallet-api/Perps/depositQuote`, `depositRequest` and `depositMaxBuffer` are now `wallet-api/Perps/deposit/quote`, `deposit/request` and `deposit/maxBuffer`.
