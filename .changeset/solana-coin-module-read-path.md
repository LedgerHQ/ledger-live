---
"@ledgerhq/coin-solana": minor
---

Preparation for running Solana on the generic coin framework, with no effect on the app yet: the family is still served by its legacy bridge.

The coin module's read path now reports what an account actually holds. A balance lists the associated SPL and Token-2022 account of every mint held rather than the native one alone, a staking position carries the stake account it belongs to and its locked reserve, an operation list follows each token account's own signatures instead of only the owner's, operations come back newest-first whichever account they were found through, a token operation names only the counterparties of its own mint — so each leg of a swap no longer shows the other's — and a new `buildTokenAccountShapes` reports a token account's frozen state and its Token-2022 extensions — reading the epoch at most once per call, and never without a transfer-fee extension.
