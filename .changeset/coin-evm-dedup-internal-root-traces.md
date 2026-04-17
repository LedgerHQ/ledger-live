---
"@ledgerhq/coin-evm": patch
---

Fix `getBlock` double-counting native transfers from explorer internal txs.

Blockscout (and Etherscan-like explorers) report one internal transaction per
EVM frame, which includes (a) a root trace that mirrors the coin tx's own
native transfer and (b) `delegatecall` / `staticcall` / `callcode` frames that
inherit `msg.value` from their caller without actually moving native value.
Before this fix those entries were treated as independent native transfers,
producing up to three identical OUTs for a single contract interaction and
driving indexer balances (e.g. A4 on Somnia) negative.

Two complementary filters are now applied:

- **Semantic** — `internalTxsToOperationsByHash` (Etherscan/Blockscout) and
  `traceBlockItemsToOperationsByHash` (RPC `trace_block`) drop frames whose
  `callType` (or Etherscan `type`) is one of `delegatecall`, `staticcall`,
  `callcode`. These opcodes cannot move native value.
- **Structural** — `mergeInternalTransactions` runs a provider-agnostic dedup
  (`dropRootTraceDuplicates`) that drops any remaining internal native op
  whose `(address, peer, amount)` tuple exactly matches one of the coin tx's
  own native ops. Acts as a safety net for future explorer variants.
