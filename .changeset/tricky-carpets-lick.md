---
"@ledgerhq/coin-evm": minor
---

Add a mandatory `resolveOperationAmount` to `StakingContractConfig`, following the same config-driven pattern as `resolveValidatorAddress`. Each chain owns its amount derivation; 0G calls `convertToTokens(shares)` on the validator contract so the undelegate drawer shows the real OG token amount instead of the raw vault-share value.
