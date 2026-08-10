---
"@ledgerhq/coin-tron": minor
"@ledgerhq/live-common": minor
---

Add Tronify gas-sponsoring to the Tron coin module (LIVE-32775 / 32776 / 32777): an optional `energyProviderInfo` marks a send as sponsored, `estimateFees` reports the energy-cost savings estimate, and `validateIntent` reserves the USDT rental fee so an under-funded send is rejected. Inert unless `energyRent` is configured and the send sets `energyProviderInfo` — otherwise behavior is unchanged.
