---
"@ledgerhq/coin-zcash": minor
"@ledgerhq/coin-bitcoin": minor
"@ledgerhq/live-common": patch
"ledger-live-desktop": minor
---

Restrict the Zcash shielded send flow to the Ironwood pool only.

Post NU6.3 the Ironwood pool is where newly shielded value lands, and the Sapling/Orchard send flows are deprecated. The `"ironwood"` and `"ironwood-to-transparent"` transfer types are removed: `"shielded"` (z→z) and `"shielded-to-transparent"` (z→t) now mean spending from the Ironwood pool. Note selection, the amount/balance validation, the ZIP-317 fee model and the V6 PCZT builder for these flows now target the Ironwood notes and balance, and the send modal's balance selector exposes the private (shielded) pool without the "Ironwood" wording.
