---
"@ledgerhq/coin-evm": minor
---

Make the EIP-7623 calldata floor remotely configurable through the new `calldataFloorGasPerToken` and `calldataFloorZeroByteTokens` coin config fields. Both default to the current EIP-7623 values, so behaviour is unchanged unless they are set; EIP-7976 can then be activated per chain without a release.
