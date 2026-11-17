---
"@ledgerhq/coin-solana": patch
---

`listOperations` returns a hidden `NONE` operation of value 0 for a transaction that reaches the address through one of its token accounts without changing anything it holds (a failed transfer, or a transfer of 0 tokens). The generic coin framework resumes each sync from the newest stored operation, so such transactions were downloaded again on every sync until the owner made a real transaction.
