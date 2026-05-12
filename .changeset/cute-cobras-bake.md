---
"@ledgerhq/ledger-wallet-framework": patch
---

Fix shouldRetainPendingOperation dropping optimistic operations across digit boundaries

The previous implementation compared `transactionSequenceNumber` values with `<=`, which
coerces BigNumber operands to strings via `valueOf()` and compares them lexicographically.
Whenever the optimistic op's sequence crossed a digit boundary (e.g. 99 → 100), the
string compare (`"100" < "99"`) erroneously dropped the fresh pending op, leaving the
OperationDetails drawer empty after a successful send (seen on Solana E2E).
Switched to `BigNumber.prototype.lte(...)` so the comparison is numeric.
