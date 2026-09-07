---
"@ledgerhq/coin-solana": minor
---

Bring the Solana coin-module logic the generic coin framework calls up to what the legacy bridge already does: transaction crafting, fee estimation, intent validation, operation listing, balances and stakes. Reached only through `api/index.ts`, which the framework flag gates, so the legacy Solana bridge is unaffected.
