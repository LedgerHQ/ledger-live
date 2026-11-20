---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/live-common": minor
"@ledgerhq/coin-near": minor
---

`@ledgerhq/types-live`: add the optional `Account.historyRecheck`, the history read and pool lookups the generic sync still owes.
`@ledgerhq/ledger-wallet-framework`: add `BridgeApi.syncsHistoryOnStateChange`, `getKnownValidatorIds`, `getStakingCallValidatorId`, `isOperationSettled` and `needsValidatorListing`, serialize `historyRecheck`, and add `mergeOpsKeepingOlder`.
`@ledgerhq/live-common`: the generic sync of NEAR reads the history only when the account balance changed, and an account is saved again when an operation is replaced or re-read with a new fee or outcome.
`@ledgerhq/coin-near`: the sync reads the account state from the node; a node error is no longer read as an unknown account, and `getBalance` accepts `knownValidatorIds` and `listValidators`.
