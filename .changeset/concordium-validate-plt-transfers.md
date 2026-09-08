---
"@ledgerhq/coin-concordium": minor
"@ledgerhq/concordium-core": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Validate PLT transfers and fix estimateMaxSpendable for tokens

`getTransactionStatus` checks a PLT amount against the token sub-account and its fee
against the CCD at the parent's disposal, and blocks on token state and device limits.
`estimateMaxSpendable` returns the full token balance instead of subtracting µCCD fees.
A PLT fee is priced from the buffered energy, so it covers the deposit the chain
requires. `concordium-core` lowers the PLT decimals ceiling to 18. Adds the English
error strings.
