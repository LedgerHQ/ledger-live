---
"@ledgerhq/asset-aggregation": minor
---

Fix Stellar USDC (and MultiversX tokens) not aggregating under their cross-network meta-currency in the portfolio asset distribution. Apply legacyIdToApiId when resolving DADA-keyed lookups so LL-format ids (mixed-case Stellar, multiversx prefix) match the API-format ids returned by DADA.
