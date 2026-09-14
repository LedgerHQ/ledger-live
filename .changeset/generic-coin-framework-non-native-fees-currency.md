---
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
---

Support chains that charge fees in a currency other than their own

The generic coin framework took a transaction fee to be denominated in the account's own currency:
`computeOperationValue` folds `tx.fees` into the value of a native debit and of a failed operation,
and the UI renders it with the account's unit. That holds for almost every chain, but not for one
that bills gas in a separate asset — VeChain charges VTHO on an account that holds VET, so folding
the fee in would inflate the debit with an unrelated amount.

A family can now declare `feesCurrencyId` on its `BridgeApi`. The framework resolves it the same way
`fromAccountRaw` resolves a persisted `feesCurrencyId`, records it as the account's `feesCurrency` so
fees render in their own unit, and stops folding fees into native operation values.

The field is optional and the framework defaults to treating fees as native, so a family that
declares nothing is unaffected.
