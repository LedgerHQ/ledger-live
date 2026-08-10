---
"@ledgerhq/coin-hedera": minor
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Rename Hedera's `HederaValidator.nodeId` to `id` (string), matching the framework's `Validator.id` and removing the duplicate identity field. Preload caches persisted by earlier versions are migrated on hydration, so upgrading users keep their cached validators. On-chain protocol fields (`Transaction.stakingNodeId`, `HederaDelegation.nodeId`) are unchanged.
