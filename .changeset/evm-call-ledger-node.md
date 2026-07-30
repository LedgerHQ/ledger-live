---
"@ledgerhq/coin-evm": minor
"@ledgerhq/coin-celo": minor
---

Support the read-only smart-contract `call` (ADR-044) on EVM Ledger nodes, in addition to external RPC nodes. Ledger nodes serve it through the explorer `contract/read` endpoint (the same one already used for allowances and L1 fee oracles), so `call` no longer throws "call is not supported" on Ledger-node chains.
