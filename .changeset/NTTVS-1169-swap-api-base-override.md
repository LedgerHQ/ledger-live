---
"@ledgerhq/wallet-cli": minor
---

Let `SWAP_API_BASE` point the swap commands at another Swap API, such as staging. wallet-cli prints that URL on stderr and refuses a value that is not an http(s) URL or carries `user:pass@`, a query or a fragment
