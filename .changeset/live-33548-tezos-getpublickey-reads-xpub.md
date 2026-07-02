---
"@ledgerhq/live-common": patch
"@ledgerhq/live-wallet": patch
---

Fix Tezos `account.getPublicKey` (Wallet API): resolve the account public key from `xpub` instead of `seedIdentifier`, which is derived from a different path (`44'/1729'/0'`) and returned the same wrong address for every Tezos account. Accounts not yet device-healed (where `xpub` still holds the address) now fail closed via a shared guard. The per-family resolver map is retained for chains that need bespoke retrieval. Also stop seeding `xpub` with the address on Tezos QR import.
