---
"live-mobile": minor
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": patch
---

Wire EVM claim rewards flow on mobile, emit fees-exceed-rewards bridge warning, and map `claimReward` staking operations to the `REWARD` type (optimistic and confirmed) so claimed rewards show as incoming in the operation history. Bump `@ledgerhq/coin-module-framework` to 3.2.0 so `'claimReward'` is part of the framework's `StakingOperation` union.
