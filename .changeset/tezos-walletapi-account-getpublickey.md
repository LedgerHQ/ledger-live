---
"@ledgerhq/live-common": minor
---

Handle the Wallet API `account.getPublicKey` method. The wallet resolves the account public key per family, fail-closed: Tezos returns its base58 public key (from `seedIdentifier`) and every other family rejects with "not implemented". Enables dApp flows that need the public key up front (e.g. `tezos_getAccounts`).
