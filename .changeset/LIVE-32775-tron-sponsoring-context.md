---
"@ledgerhq/coin-tron": patch
---

Add gas-sponsoring (Tronify) context to the Tron transaction model (LIVE-32775). A new optional `energyProviderInfo` field (`{ providerId, orderId }`) marks a send as sponsored; it is set by the front-end Send flow, round-trips through transaction serialization, and is threaded to the fee-estimation, validation and signing seams so later work can price a sponsored USDT send as energy-rented rather than burning TRX. Absent `energyProviderInfo` keeps the current standard-crafting behavior unchanged.
