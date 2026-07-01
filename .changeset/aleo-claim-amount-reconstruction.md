---
"@ledgerhq/coin-aleo": patch
"ledger-live-desktop": patch
---

Fix Aleo `claim_unbond_public` operations always showing a 0 amount by reconstructing the claimed amount from prior `unbond_public` history (best-effort estimate). Align `bond_public`/`unbond_public`/`claim_unbond_public` operation value semantics with the standard staking convention: `operation.value` is fee-only, real amounts are exposed via `operation.extra` and rendered as a dedicated amount line in the operation details.
