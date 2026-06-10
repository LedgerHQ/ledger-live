---
"@ledgerhq/coin-evm": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": patch
---

Support Monad native staking claim rewards: add the per-chain `claimReward` operation (keyed by the numeric validator id) and thread the validator id from the delegation through the claim flow on mobile and desktop. Always source `validatorId` from the delegation so claiming no longer fails with "monad staking requires valId" when the matched validator from the loaded list lacks an id.
