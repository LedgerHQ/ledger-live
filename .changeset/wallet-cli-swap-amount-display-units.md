---
"@ledgerhq/wallet-cli": minor
---

`swap execute` now reports `amountExpectedTo` in display units (e.g. `1.2345` ETH) instead of atomic units, both in the human output and the JSON envelope, and sends the same display-unit value as the `toAmount` analytics property. The atomic value is still available under the new `amountExpectedToAtomic` field for scripts that relied on the previous behaviour. `magnitudeAwareRate` is unchanged and stays an atomic-to over atomic-from ratio, matching live-common's convention.
