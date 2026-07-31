---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-tezos": patch
---

Add an optional `readiness` attribute to the base `Account` type (`{ ready: boolean; reason?: string }`), a generic cross-chain projection of whether an account is fully operational. It is persisted through account serialization and populated during sync via a new optional `BridgeApi.getAccountReadiness` hook. Tezos implements the hook: an account whose public key is not revealed on-chain is reported as `{ ready: false, reason: "unrevealed" }`. Families that do not provide the hook leave `readiness` undefined. coin-tezos `getAccountByAddress` now coalesces concurrent same-address calls into a single request, so surfacing readiness during sync adds no redundant tzkt call.
