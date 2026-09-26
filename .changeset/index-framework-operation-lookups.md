---
"@ledgerhq/live-common": patch
"@ledgerhq/ledger-wallet-framework": patch
---

Index the per-hash and per-token operation lookups used when assembling an account.

Three paths previously performed a full scan per item: `buildParentOperations` looked up a
transaction's sub-operations by rescanning every sub-account's operations for each transaction,
`fromOperationRaw` did the same for every operation restored from the store (so the cost was paid on
every account load, not only on sync), and `buildSubAccounts` refiltered the whole asset-operation
list once per token. Each is now backed by an index built once per account.

The output is unchanged, ordering included: sub-operations are still ordered by sub-account, then by
position within that sub-account's operations, then by its pending operations, and sub-account
membership still compares `assetReference` case-insensitively when both sides are strings (falling
back to an exact match otherwise) and still discriminates on `assetOwner`.

`inferSubOperations` keeps its exact signature and behaviour for its other callers.
`buildSubOperationIndex` is exported alongside it, and `fromOperationRaw` accepts the index as a new
optional fifth argument; the existing four-argument form is unchanged.
