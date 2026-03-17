# Internal transactions retrieval in getBlock

This document describes how internal transactions are fetched and merged when calling `getBlock(currency, height)`.

## Flow overview

```mermaid
flowchart TB
  subgraph entry["getBlock(currency, height)"]
    A[getNodeApi] --> B[internalTransactionsFetcher(nodeApi, currency)]
    B --> C[fetchInternalTxs = fetcher function]
  end

  subgraph parallel["Promise.all (parallel)"]
    D[nodeApi.getBlockByHeight(currency, height, true)]
    E[fetchInternalTxs(height)]
  end

  A --> parallel
  C --> E

  subgraph fetcher["internalTransactionsFetcher — builds fetcher for (height)"]
    F{isEtherscanLikeExplorerConfig(explorer)?}
    F -->|yes| G[getInternalTransactionsByBlock(currency, height)]
    G --> H[GET explorer?module=account&action=txlistinternal<br/>fromBlock/toBlock=height, paginated]
    H --> I[internalTxsToOperationsByHash]
    I --> J{success?}
    J -->|no| K[nodeFallback(height)]
    J -->|yes| L["Map(txHash → BlockOperation[])"]

    F -->|no| K
    K --> M{traceBlock defined?}
    M -->|no| N[log error, return empty Map]
    M -->|yes| O[nodeApi.traceBlock(currency, height)]
    O --> P[RPC trace_block]
    P --> Q[traceBlockItemsToOperationsByHash]
    Q --> L
    N --> L
  end

  E -.-> fetcher

  subgraph after["after parallel"]
    R[result, internalTxs]
    S[getTransactionsFromNode]
    T[mergeInternalTransactions(transactions, internalTxs)]
    U[return Block]
  end

  parallel --> R
  R --> S
  S --> T
  T --> U
```

## Paths summary

| Explorer config              | Primary source                    | Fallback (on error / no explorer) |
|-----------------------------|------------------------------------|------------------------------------|
| Etherscan-like (etherscan, blockscout, teloscan, klaytnfinder, corescan) | `getInternalTransactionsByBlock` → Etherscan API `txlistinternal` | `nodeApi.traceBlock` (RPC `trace_block`) or empty Map |
| Other (ledger, none, …)     | `nodeApi.traceBlock` (RPC `trace_block`) | empty Map if `traceBlock` undefined or `UnsupportedRpcMethodError` |

## Data flow

1. **Explorer path**  
   `getInternalTransactionsByBlock` → `EtherscanInternalTransaction[]` → `internalTxsToOperationsByHash` → `Map<string, BlockOperation[]>`.

2. **Node path**  
   `traceBlock` → RPC `trace_block` → `TraceBlockItem[]` → `traceBlockItemsToOperationsByHash` → `Map<string, BlockOperation[]>`.

3. **Merge**  
   `mergeInternalTransactions(transactions, internalTxs)` adds each `internalTxs.get(tx.hash)` as extra `operations` on the corresponding `BlockTransaction`.

## Files

- **Fetcher & getBlock:** `libs/coin-modules/coin-evm/src/logic/getBlock.ts`
- **Explorer internal txs:** `libs/coin-modules/coin-evm/src/network/explorer/etherscan.ts` (`getInternalTransactionsByBlock`)
- **Explorer → operations:** `libs/coin-modules/coin-evm/src/adapters/etherscan.ts` (`internalTxsToOperationsByHash`)
- **RPC trace_block:** `libs/coin-modules/coin-evm/src/network/node/rpc.common.ts` (`traceBlock`)
- **Trace → operations:** `libs/coin-modules/coin-evm/src/adapters/blockOperations.ts` (`traceBlockItemsToOperationsByHash`)
