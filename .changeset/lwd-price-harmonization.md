---
"ledger-live-desktop": minor
"@ledgerhq/asset-detail": minor
---

Harmonize asset prices across Global Search, the Assets table and Asset detail so the same asset shows the same price to the cent. The Assets table Price column now sources from DADA (with the USD→fiat conversion applied, fixing non-USD fiats like MAD/EUR) and Asset detail reads from the shared bulk DADA cache, removing the transient drift between screens. The Value column stays on countervalues for portfolio consistency.
