---
"@ledgerhq/coin-evm": patch
"@ledgerhq/coin-celo": patch
---

coin-evm: move the Celo-only sync helpers (getSyncHash / createSwapHistoryMap / mergeSubAccounts) out of coin-evm into coin-celo, their sole consumer
