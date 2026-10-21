---
"@ledgerhq/coin-solana": patch
---

Keep the real rejection reason when a Solana transaction fails at preflight, instead of masking it with "Invalid param: WrongSize".
