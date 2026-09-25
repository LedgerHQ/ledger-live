---
"@ledgerhq/coin-cosmos": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

feat(cosmos): move the Cosmos memo onto the shared generic-adapter memo fields (LIVE-36108)

Prep work for the Cosmos generic-coin-framework migration (depends on LIVE-35735, already fixed):
the shared `transactionToIntent` only reads `memoType`/`memoValue`, fields the four Cosmos memo
write sites (desktop send field, mobile memo-tag input, mobile edit-memo screen, wallet-api
adapter) never set — they only wrote the legacy `memo` field. Left as is, flipping Cosmos into
`genericCoinFrameworkFamilies.json` in a later ticket would silently drop every memo, with no
error anywhere.

Adds a `cosmos` entry to the shared memo-application registry, adds `memoType`/`memoValue` to
`CosmosLikeTransaction` alongside the existing `memo` field (read unchanged by the live legacy
bridge), and centralizes the three-field patch in a single `cosmosMemoPatch` helper all four
write sites now call, so they can't drift out of sync. Also adds the memo length check
(`CosmosMemoTooLong`) to the Alpaca `validateIntent`, which nothing previously enforced outside
the UI's `maxLength` truncation.
