---
"@ledgerhq/coin-evm": patch
"@ledgerhq/live-common": patch
---

feat(coin-evm): paginate EVM staking validators

`getValidators` is now cursor-based and returns a `Page<StakingValidatorItem>`, and the
`useEvmStakingValidators` hook walks every page (following `next`) instead of reading only
the first one. Each page is cached independently in the LRU cache (`currencyId-cursor` key).
Sei stays single-page (`next: undefined`), so its behaviour is unchanged.
