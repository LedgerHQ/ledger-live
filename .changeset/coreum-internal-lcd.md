---
"@ledgerhq/coin-cosmos": patch
---

fix(coin-cosmos): default Coreum LCD to the Ledger-hosted node

The default `lcd` for `coreum` now points to `https://tx.coin.ledger.com` instead of the public
`rest-coreum.ecostake.com` endpoint, matching the Firebase remote config already switched in
test, staging and production.
