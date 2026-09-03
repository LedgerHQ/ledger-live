---
"@ledgerhq/coin-tron": major
"@ledgerhq/live-common": patch
---

Move the Tron `getAddress` signer out of coin-tron into `families/tron/`, so coin-tron no
longer depends on the ledger-wallet-framework signer, derivation and bridge entry points.
The `@ledgerhq/coin-tron/signer` sub-path export is removed.
