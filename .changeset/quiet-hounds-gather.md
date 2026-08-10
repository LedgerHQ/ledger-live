---
"@ledgerhq/coin-tron": minor
---

Add the Tronify energy-rent provider client (ADR-050): a `network/tronify` REST client, a `logic/energyRent` provider switch exposing quote/craft/broadcast/status, plus `energyRent` coin-config settings and the `TronifyApiError` / `EnergyRentProviderNotConfigured` error types. Additive and opt-in — the config field is optional and no existing behaviour changes.
