---
"@ledgerhq/coin-cardano": major
"@ledgerhq/live-common": major
"ledger-live-desktop": minor
"live-mobile": minor
---

Drive coin-cardano by the coin config: the bridge takes a Context, the fee ratio and pool page size become required config fields, the Ledger pool ids an optional one, and an invalid value throws `CardanoInvalidConfigError`
