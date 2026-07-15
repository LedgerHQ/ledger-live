---
"@ledgerhq/ledger-key-ring-protocol": patch
---

Mock SDK: make `walletSyncEncryptionKey` a valid 64-char hex string (distinct per application index). The value is contractually hex (the real SDK feeds it to `crypto.from_hex`), so consumers deriving keys from it now work against the mock.
