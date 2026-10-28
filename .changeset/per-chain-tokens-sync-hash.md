---
"@domain/api-currency-token": minor
"@features/platform-currencies": minor
"@ledgerhq/coin-tester-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

The account sync hash is now the CAL token list hash of the account's network (`token_list_hash` from `/v1/networks`, new `getTokenListHash` endpoint) instead of the `X-Ledger-Commit` header. The commit header changed on every CAL deployment, so an update to any chain's tokens made every account of every network resync from scratch. A network the CAL lists no token for gets a fixed `no-tokens` hash.

The token cache is still validated against the commit (`getTokensSyncHash` endpoint), so a metadata-only token correction still evicts it.

Stored sync hashes were built from the commit, so each account resyncs from scratch once after this update.
