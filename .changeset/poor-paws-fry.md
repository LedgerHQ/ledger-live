---
"@ledgerhq/coin-tezos": minor
---

Fix getBlock to fetch originations, use correct FA2 token standard (fa2 instead of token), filter block token transfers to fa2/tokenId=0 (matching listOperations), and resolve cross-block origination hashes for token transfers.
