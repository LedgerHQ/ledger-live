---
"@ledgerhq/coin-evm": patch
---

Fix `getBlock` and `listOperations` double-counting native transfers from explorer internal
txs. Blockscout and Etherscan expose the root call of every tx as an internal transaction,
and report `delegatecall`/`staticcall`/`callcode` frames with an inherited `msg.value` that
cannot actually move native ETH — both were surfaced as independent native ops, driving
downstream indexer balances negative and producing phantom IN/OUT ops in account history.
The three internal-tx adapters now skip non-value-transferring call types, and
`mergeInternalTransactions` runs a provider-agnostic structural dedup as a safety net.
