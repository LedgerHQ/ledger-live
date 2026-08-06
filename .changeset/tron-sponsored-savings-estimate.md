---
"@ledgerhq/coin-tron": minor
---

Expose a savings estimate for gas-sponsored (Tronify) Tron sends (LIVE-32776). When a send carries `energyProviderInfo`, `getTransactionStatus` now returns a `sponsoredEnergy` field on the transaction status: the disclosed energy provider (`{ id, name }`, resolved from a new in-module registry exported as `ENERGY_PROVIDERS`/`getEnergyProvider`) and `avoidedEnergyFees` — the native TRX (in SUN) that a non-sponsored USDT transfer would burn on energy (`energyRequired × energyFee`). The coin module stays fiat-agnostic: the front end converts the value to fiat and renders "Saved $X.XX with <provider>". It is informational only and does not change `estimatedFees`; pricing a sponsored send as energy-rented remains future work (LIVE-32892).
