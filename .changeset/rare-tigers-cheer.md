---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/coin-evm": patch
---

Remove `assetReference`/`assetOwner` from `GenericTransaction` and make `subAccountId` the single source of truth for token identification in the generic coin framework (LIVE-24044). The token asset is now derived from the sub-account's token via `getAssetFromToken` in `transactionToIntent`, and `subAccountId` is serialized so the edit-transaction flow restores the token without those fields. Stellar keeps its own `assetReference`/`assetOwner` for the `changeTrust` flow (no sub-account yet), and its device confirmation now derives the token asset from the sub-account for token sends.
