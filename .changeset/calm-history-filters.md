---
"@domain/entity-card-asset-mapping": minor
"@features/flow-pay-card-transactions": minor
"@features/flow-pay-card-assets": patch
"ledger-live-desktop": minor
---

Add asset-scoped Pay card transaction history, and a Cashback column to the card history table. The
scope is a Ledger currency id, matched against a funding source with `isBaanxAssetCurrency`.
