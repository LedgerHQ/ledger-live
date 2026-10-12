---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Retry a swap up to twice, without showing the error, when the Exchange app rejects the provider signature (`signVerificationFail` at `CHECK_TRANSACTION_SIGNATURE`). `executeSwap` requests a new nonce and calls `/swap` again with the same parameters. Each rejected attempt is still reported to `/swap/cancelled`, with the attempt in the error message: `Signature verification failed Code: R0` for the first attempt, then `R1` and `R2` for the retries. This replaces the `[diagnostic=…]` signature classification, which is removed
