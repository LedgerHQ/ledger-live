---
"@ledgerhq/coin-tezos": minor
---

Fix: batch id.in lookups in getAccountTokenTransfers into chunks of 100 to avoid oversized URLs that caused HTTP 520 errors on the Cloudflare proxy
