---
"@domain/api-currency-token": minor
"@features/platform-currencies": patch
"@ledgerhq/wallet-cli": patch
"@ledgerhq/coin-tester-evm": patch
"ledger-live-desktop": minor
"live-mobile": minor
---

`getTokensSyncHash` now returns the CAL token list hash of the requested network (`token_list_hash` from `/v1/networks`) instead of the `X-Ledger-Commit` header. The commit header changed on every CAL deployment, so an update to any chain's tokens made every account of every network resync from scratch. A network the CAL lists no token for gets a fixed `no-tokens` hash.

Stored sync hashes were built from the commit, so each account resyncs from scratch once after this update.
