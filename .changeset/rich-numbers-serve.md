---
"@ledgerhq/types-live": minor
"@ledgerhq/ledger-wallet-framework": minor
"@ledgerhq/coin-evm": major
"@ledgerhq/live-common": patch
---

Move EVM staking types to `@ledgerhq/types-live` and strongly type the `BridgeApi.enrichStakingResources` hook so the generic coin framework no longer depends on `@ledgerhq/coin-evm`.
