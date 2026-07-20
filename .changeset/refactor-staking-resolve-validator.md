---
"@ledgerhq/coin-evm": minor
---

Replace `typeof d[0]` type-sniffing in `resolveStakingValidator` with a per-chain `resolveValidatorAddress` on `StakingContractConfig`. Fixes 0G operation drawer pointing to delegator address instead of validator.
