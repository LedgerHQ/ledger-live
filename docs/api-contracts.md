# Ledger Live - Coin Module API Contracts

> **Generated:** 2026-01-23 | **Source:** `libs/coin-framework/src/api/types.ts`

## Overview

This document defines the API contracts for coin modules in Ledger Live. All coin module implementations must adhere to these interfaces to ensure consistent behavior across the application.

---

## Core API Types

The coin module API is composed of two main interfaces:

```typescript
export type Api<MemoType, TxDataType> = AlpacaApi<MemoType, TxDataType> & BridgeApi<MemoType, TxDataType>;
```

| Interface | Purpose |
|-----------|---------|
| **AlpacaApi** | Core blockchain operations (balance, transactions, staking) |
| **BridgeApi** | Transaction validation and bridge-specific utilities |

---

## AlpacaApi Interface

The primary interface for blockchain interactions.

```typescript
export type AlpacaApi<MemoType, TxDataType> = {
  // Transaction Broadcasting
  broadcast: (tx: string, broadcastConfig?: BroadcastConfig) => Promise<string>;
  combine: (tx: string, signature: string, pubkey?: string) => string | Promise<string>;

  // Transaction Crafting
  estimateFees: (intent: TransactionIntent, customFees?: FeeEstimation["parameters"]) => Promise<FeeEstimation>;
  craftTransaction: (intent: TransactionIntent, customFees?: FeeEstimation) => Promise<CraftedTransaction>;
  craftRawTransaction: (transaction: string, sender: string, publicKey: string, sequence: bigint) => Promise<CraftedTransaction>;

  // Account & Balance
  getBalance: (address: string) => Promise<Balance[]>;

  // Block Information
  lastBlock: () => Promise<BlockInfo>;
  getBlockInfo: (height: number) => Promise<BlockInfo>;
  getBlock: (height: number) => Promise<Block>;

  // Operations/Transactions
  listOperations: (address: string, pagination: Pagination) => Promise<[Operation[], string]>;

  // Staking (optional - may throw "not supported")
  getStakes: (address: string, cursor?: Cursor) => Promise<Page<Stake>>;
  getRewards: (address: string, cursor?: Cursor) => Promise<Page<Reward>>;
  getValidators: (cursor?: Cursor) => Promise<Page<Validator>>;
};
```

### Method Descriptions

| Method | Description | Required |
|--------|-------------|----------|
| `broadcast` | Submit signed transaction to network | Yes |
| `combine` | Combine unsigned transaction with signature | Yes |
| `estimateFees` | Estimate transaction fees | Yes |
| `craftTransaction` | Build transaction from intent | Yes |
| `craftRawTransaction` | Build transaction from raw data | Optional |
| `getBalance` | Get all balances for address | Yes |
| `lastBlock` | Get latest block info | Yes |
| `getBlockInfo` | Get block info by height | Optional |
| `getBlock` | Get full block with transactions | Optional |
| `listOperations` | List account operations | Yes |
| `getStakes` | Get staking positions | Optional |
| `getRewards` | Get staking rewards history | Optional |
| `getValidators` | Get network validators | Optional |

---

## BridgeApi Interface

Provides transaction validation and bridge-specific utilities.

```typescript
export type BridgeApi<MemoType, TxDataType> = {
  validateIntent: (
    intent: TransactionIntent,
    balances: Balance[],
    customFees?: FeeEstimation
  ) => Promise<TransactionValidation>;

  getSequence: (address: string) => Promise<bigint>;

  // Optional methods
  getChainSpecificRules?: () => ChainSpecificRules;
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
  getAssetFromToken?: (token: TokenCurrency, owner: string) => AssetInfo;
  computeIntentType?: (transaction: Record<string, unknown>) => string;
  refreshOperations?: (operations: LiveOperation[]) => Promise<LiveOperation[]>;
};
```

---

## Data Types

### Operation

Represents a blockchain operation (transaction effect on an account).

```typescript
export type Operation<MemoType extends Memo = MemoNotSupported> = {
  id: string;                          // Unique operation identifier
  type: string;                        // Operation type (send, receive, stake, etc.)
  senders: string[];                   // Sender addresses
  recipients: string[];                // Recipient addresses
  value: bigint;                       // Operation value in base units
  asset: AssetInfo;                    // Asset information
  memo?: MemoType;                     // Optional memo
  details?: Record<string, unknown>;   // Chain-specific details

  tx: {
    hash: string;                      // Transaction hash
    block: BlockInfo;                  // Block metadata
    fees: bigint;                      // Network fees paid
    date: Date;                        // Transaction date
    failed: boolean;                   // Whether tx failed
  };
};
```

### Balance

Represents an account balance for a single asset.

```typescript
export type Balance = {
  value: bigint;        // Balance value in base units (always positive)
  asset: AssetInfo;     // The balance asset
  locked?: bigint;      // Non-spendable portion (reserved, rent, etc.)
  stake?: Stake;        // Associated stake if any
};
```

### AssetInfo

Describes an asset (native coin or token).

```typescript
export type AssetInfo =
  | { type: "native"; name?: string; unit?: Unit }
  | {
      type: string;           // token, trc20, erc20, etc.
      assetReference?: string; // contract address, tokenId, etc.
      assetOwner?: string;
      name?: string;
      unit?: Unit;
    };
```

### BlockInfo

Block metadata.

```typescript
export type BlockInfo = {
  height: number;
  hash?: string;
  time?: Date;          // Block time (may differ from tx date)
  parent?: BlockInfo;
};
```

### TransactionIntent

Describes the user's intention to create a transaction.

```typescript
export type TransactionIntent<MemoType, TxDataType> = {
  intentType: "transaction" | "staking";
  type: string;
  sender: string;
  recipient: string;
  amount: bigint;
  asset: AssetInfo;
  useAllAmount?: boolean;
  feesStrategy?: FeesStrategy;      // "slow" | "medium" | "fast" | "custom"
  senderPublicKey?: string;
  sequence?: bigint;
  expiration?: number;
  sponsored?: boolean;
} & MaybeMemo<MemoType> & MaybeTxData<TxDataType>;
```

### Specialized Transaction Intents

```typescript
// For staking operations
export type StakingTransactionIntent = TransactionIntent & {
  intentType: "staking";
  mode: StakingOperation;    // "delegate" | "undelegate" | "redelegate"
  valAddress: string;
  dstValAddress?: string;
};

// For send operations
export type SendTransactionIntent = TransactionIntent & {
  intentType: "transaction";
};
```

### TransactionValidation

Result of validating a transaction intent.

```typescript
export type TransactionValidation = {
  errors: Record<string, Error>;     // Validation errors by field
  warnings: Record<string, Error>;   // Validation warnings by field
  estimatedFees: bigint;
  totalFees?: bigint;
  amount: bigint;
  totalSpent: bigint;
};
```

### CraftedTransaction

Result of crafting a transaction.

```typescript
export type CraftedTransaction = {
  transaction: string;                  // Serialized transaction
  details?: Record<string, unknown>;    // Chain-specific details (UTXOs, etc.)
};
```

---

## Staking Types

### Stake

Represents a staking position.

```typescript
export type Stake = {
  uid: string;                  // Globally unique stake identifier
  address: string;              // Owning account address
  delegate?: string;            // Validator address
  state: StakeState;            // "inactive" | "activating" | "active" | "deactivating"
  stateUpdatedAt?: Date;
  createdAt?: Date;
  asset: AssetInfo;
  amount: bigint;               // Total amount (deposits + rewards)
  amountDeposited?: bigint;
  amountRewarded?: bigint;
  details?: Record<string, unknown>;
};
```

### Reward

Represents a staking reward event.

```typescript
export type Reward = {
  stake: string;                // Reference to Stake.uid
  asset: AssetInfo;
  amount: bigint;
  receivedAt: Date;
  transactionHash?: string;
  details?: Record<string, unknown>;
};
```

### Validator

Represents a network validator.

```typescript
export type Validator = {
  address: string;
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  balance?: bigint;             // Staked amount in pool
  commissionRate?: string;
  apy?: number;                 // Annual Percentage Yield (0-1)
};
```

---

## Pagination

### Pagination Parameters

```typescript
export type Pagination = {
  minHeight: number;            // Minimum block height to fetch from
  lastPagingToken?: string;
  pagingToken?: string;
  limit?: number;
  order?: "asc" | "desc";
};
```

### Paginated Response

```typescript
export type Cursor = string;

export type Page<T> = {
  items: T[];
  next?: Cursor | undefined;
};
```

---

## Memo Types

Memos are chain-specific metadata attached to transactions.

```typescript
// Base interface
export interface Memo {
  type: string;
}

// When memo is not supported
export interface MemoNotSupported extends Memo {
  type: "none";
}

// String-based memo
export interface StringMemo<Kind extends string = "text"> extends Memo {
  type: "string";
  kind: Kind;
  value: string;
}

// Map-based memo (multiple fields)
export interface MapMemo<Kind extends string, Value> extends Memo {
  type: string;
  memos: Map<Kind, Value>;
}
```

---

## Implementation Example

Here's a typical coin module API implementation pattern:

```typescript
// libs/coin-modules/coin-example/src/api/index.ts
import { AlpacaApi, Balance, BlockInfo, /* ... */ } from "@ledgerhq/coin-framework/api/index";
import { ExampleConfig } from "../config";
import { broadcast, combine, getBalance, listOperations, /* ... */ } from "../logic";
import type { ExampleMemo } from "../types";

export function createApi(config: ExampleConfig): AlpacaApi<ExampleMemo> {
  return {
    // Required methods - implement fully
    broadcast,
    combine,
    estimateFees,
    craftTransaction,
    getBalance,
    lastBlock,
    listOperations,

    // Optional methods - throw if not supported
    craftRawTransaction: () => {
      throw new Error("craftRawTransaction is not supported");
    },
    getBlock: () => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: () => {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes: () => {
      throw new Error("getStakes is not supported");
    },
    getRewards: () => {
      throw new Error("getRewards is not supported");
    },
    getValidators: () => {
      throw new Error("getValidators is not supported");
    },
  };
}
```

---

## Testing Requirements

Every API implementation must include:

1. **Unit tests** for all implemented methods
2. **Integration tests** validating real network behavior
3. **Test file location:** `src/api/index.integ.test.ts`

Example integration test structure:

```typescript
// src/api/index.integ.test.ts
import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";

describe("API", () => {
  let api: AlpacaApi;

  beforeAll(() => {
    api = createApi({ explorer: { url: TEST_NETWORK_URL } });
  });

  it("returns balance for address", async () => {
    const balances = await api.getBalance(TEST_ADDRESS);
    expect(balances).toEqual(expect.arrayContaining([
      expect.objectContaining({ asset: { type: "native" } })
    ]));
  });

  it("lists operations in correct order", async () => {
    const [operations] = await api.listOperations(TEST_ADDRESS, { minHeight: 0 });
    expect(operations.length).toBeGreaterThan(0);
  });

  it("broadcasts transaction successfully", async () => {
    const txId = await api.broadcast(SIGNED_TX);
    expect(txId).toEqual(expect.any(String));
  });
});
```

---

## Related Documentation

- [Architecture - Libraries](./architecture-libraries.md)
- [Testing Guide](./testing-guide.md)
- [Contribution Guide](./contribution-guide.md)
