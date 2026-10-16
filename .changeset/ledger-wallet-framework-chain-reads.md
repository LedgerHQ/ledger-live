---
"@ledgerhq/ledger-wallet-framework": minor
---

Family bridge hooks read the chain only through a `ChainReads` port (`getAccountInfo`, `call`, `getNextSequence`, `getAddressesForPublicKey`, `getTransactionInfo`) built by the path the account is on, rejecting with the new `ChainReadUnsupportedError` when that path cannot serve a read. `BridgeApi` gains `legacyChainReads`; `getAccountReadiness`, `enrichStakingResources`, `refreshOperations` and `validateTransaction` take the chain, `buildTokenAccountShapes` takes the account info, and `addressLookup` is a `FamilyAddressLookup`. An account module binding reads a `SyncedAccountModule` of key, state and UTXOs, and gains `syncedHeight`.
