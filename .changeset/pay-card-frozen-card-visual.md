---
"@features/flow-pay-card-details": minor
"@domain/api-card-management": minor
"@support/jest-features-flow": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Mark a frozen pay card on the card visual: the card face fades out behind a centered snow `Spot`, read from the same card status the freeze tile uses. The features/flow jest projects now compile `@ledgerhq/lumen-utils-shared` instead of leaving its ESM untransformed, so views can use `cn`.
