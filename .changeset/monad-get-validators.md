---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": patch
---

feat(coin-evm): fetch validators for `monad`

Adds a Monad validator fetcher that reads the staking precompile
(`getExecutionValidatorSet` + `getValidator`) and paginates via the `nextIndex`
cursor. It plugs into the shared LRU + cursor-pagination `getValidators` flow, so
`useEvmStakingValidators` walks every page. Sei stays single-page.
