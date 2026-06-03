---
"@ledgerhq/coin-evm": minor
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
---

Split EVM staking operations into per-chain modules and thread an optional validator id (`valId`) through the staking transaction/intent so chains that key operations by a numeric id (e.g. Monad) are supported alongside address-keyed chains (Sei, Celo)
