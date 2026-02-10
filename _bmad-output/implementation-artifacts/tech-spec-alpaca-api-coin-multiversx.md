---
title: 'Implement Alpaca API for coin-multiversx'
slug: 'alpaca-api-coin-multiversx'
created: '2026-01-29'
status: 'draft'
stepsCompleted: []
tech_stack:
  - TypeScript
  - '@ledgerhq/coin-framework'
  - '@ledgerhq/coin-framework/api'
  - '@multiversx/sdk-core'
  - bignumber.js
  - bech32
files_to_modify:
  - libs/coin-modules/coin-multiversx/src/logic/index.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/getBalance.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/listOperations.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/getStakes.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/getValidators.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/lastBlock.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/craftTransaction.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/estimateFees.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/combine.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/broadcast.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/validateIntent.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/getSequence.ts (create)
  - libs/coin-modules/coin-multiversx/src/logic/common.ts (create)
  - libs/coin-modules/coin-multiversx/src/api/index.ts (rewrite with createApi)
  - libs/coin-modules/coin-multiversx/src/api/types.ts (create)
  - libs/coin-modules/coin-multiversx/src/types/model.ts (create)
  - libs/coin-modules/coin-multiversx/package.json (update exports)
code_patterns:
  - 'Alpaca API pattern: createApi(config) returns Api<MemoNotSupported>'
  - 'Logic module: Pure functions consuming network layer'
  - 'Bridge remains unchanged, API is additive'
  - 'Network types stay private to api/sdk layer'
test_patterns:
  - 'Unit tests: *.test.ts next to source files in logic/'
  - 'Integration tests: *.integ.test.ts for API layer'
  - 'Mock network calls for unit tests'
  - 'Real network calls for integration tests (except broadcast)'
---

# Tech-Spec: Implement Alpaca API for coin-multiversx

**Created:** 2026-01-29
**Product Brief:** `_bmad-output/planning-artifacts/product-brief-ledger-live-2026-01-29.md`

## Overview

### Problem Statement

The coin-multiversx module uses the traditional bridge-only pattern, making it incompatible with the Alpaca backend service. The current architecture has logic embedded in SDK functions without a standardized API interface.

### Solution

Implement the Alpaca `Api` interface for coin-multiversx:
- Create `logic/` module with pure functions for each API method
- Implement `createApi(config)` factory returning `Api<MemoNotSupported, TxDataNotSupported>`
- Support EGLD native transfers and ESDT token transfers
- Support delegation/staking with `getStakes()` and `getValidators()`
- Bridge remains unchanged (API is additive)

### Scope

**In Scope:**
- All `AlpacaApi` methods (14 total, 4 throw "not supported")
- All `BridgeApi` methods
- ESDT token support in `getBalance`, `listOperations`, `craftTransaction`
- Delegation support in `getStakes`, `getValidators`
- Unit tests with 100% coverage
- Integration tests for each implemented API method

**Out of Scope:**
- Bridge refactoring to consume logic functions
- Coin-tester implementation
- Guarded account handling
- Historical rewards (`getRewards`)

## Context for Development

### Existing Code Structure

```
coin-multiversx/src/
├── api/
│   ├── apiCalls.ts          # MultiversXApi class (HTTP client)
│   ├── sdk.ts               # Wrapper functions (getAccount, getProviders, etc.)
│   ├── index.ts             # Exports
│   └── dtos/
│       └── multiversx-account.ts
├── bridge/
│   └── js.ts                # createBridges (unchanged)
├── buildTransaction.ts      # Transaction building
├── encode.ts                # Transaction data encoding
├── getTransactionStatus.ts  # Validation logic
├── prepareTransaction.ts    # Fee calculation
├── logic.ts                 # Address validation, helpers
├── synchronisation.ts       # getAccountShape
├── preload.ts               # Validator preloading
├── buildSubAccounts.ts      # ESDT token accounts
├── constants.ts             # Gas limits, chain config
└── types.ts                 # Type definitions
```

### Key Existing Functions to Reuse

| Function | Location | Purpose |
|----------|----------|---------|
| `getAccount()` | sdk.ts | Fetch balance and nonce |
| `getProviders()` | sdk.ts | Fetch validators |
| `getAccountDelegations()` | sdk.ts | Fetch delegations |
| `getAccountESDTTokens()` | sdk.ts | Fetch token balances |
| `getEGLDOperations()` | sdk.ts | Fetch EGLD transactions |
| `getESDTOperations()` | sdk.ts | Fetch ESDT transactions |
| `getAccountNonce()` | sdk.ts | Fetch nonce for sequence |
| `getFees()` | sdk.ts | Calculate gas fees |
| `broadcastTransaction()` | sdk.ts | Submit signed tx |
| `doBuildTransactionToSign()` | buildTransaction.ts | Build unsigned tx |
| `isValidAddress()` | logic.ts | Address validation |

### Api Interface Reference

```typescript
type Api<MemoType, TxDataType> = AlpacaApi<MemoType, TxDataType> & BridgeApi<MemoType, TxDataType>;

// For MultiversX:
type MultiversXApi = Api<MemoNotSupported, TxDataNotSupported>;
```

## Implementation Plan

### Tasks

#### Phase 1: Types & Foundation

- [ ] **Task 1: Create types/model.ts**
  - File: `libs/coin-modules/coin-multiversx/src/types/model.ts`
  - Action: Create types for Alpaca API layer
  - Details:
    ```typescript
    import type { FeeEstimation } from "@ledgerhq/coin-framework/api/index";
    
    export interface MultiversXFeeEstimation extends FeeEstimation {
      parameters?: {
        gasLimit: bigint;
        gasPrice: bigint;
      };
    }
    
    export interface CraftTransactionInput {
      sender: string;
      recipient: string;
      amount: bigint;
      nonce: number;
      gasLimit?: number;
      mode: "send" | "delegate" | "unDelegate" | "claimRewards" | "withdraw" | "reDelegateRewards";
      // ESDT token transfer
      tokenIdentifier?: string;
    }
    ```

- [ ] **Task 2: Create api/types.ts**
  - File: `libs/coin-modules/coin-multiversx/src/api/types.ts`
  - Action: Create API-specific types
  - Details:
    ```typescript
    import type { Api, MemoNotSupported, TxDataNotSupported } from "@ledgerhq/coin-framework/api/index";
    
    export type MultiversXApi = Api<MemoNotSupported, TxDataNotSupported>;
    ```

#### Phase 2: Logic Module

- [x] **Task 3: Create logic/mappers.ts** *(Completed in Epic 1 + Story 2.1)*
  - File: `libs/coin-modules/coin-multiversx/src/logic/mappers.ts`
  - Action: Create mapper functions for data transformation (ADR-001 pattern)
  - **Implemented Functions:**
    - `mapToBalance(balance: string): Balance` - Maps native EGLD balance
    - `mapToEsdtBalance(token: ESDTToken): Balance` - Maps ESDT token to Balance
    - `mapToOperation(raw: MultiversXApiTransaction, address: string): Operation` - Maps transaction to Alpaca Operation *(Story 2.1)*
    - `toBigInt(value: unknown): bigint` - Helper to safely convert BigNumber/string/number to bigint
  - **Unit Tests:** 26 tests in `mappers.test.ts`
  - Details:
    ```typescript
    import type { Balance, Operation } from "@ledgerhq/coin-framework/api/types";
    import type { ESDTToken, MultiversXApiTransaction } from "../types";
    
    export function mapToBalance(balance: string): Balance { ... }
    export function mapToEsdtBalance(token: ESDTToken): Balance { ... }
    export function mapToOperation(raw: MultiversXApiTransaction, address: string): Operation {
      const isSender = raw.sender === address;
      const type = isSender ? "OUT" : "IN";
      const fees = toBigInt(raw.fee ?? raw.fees);
      const value = toBigInt(raw.value);
      const height = raw.round ?? raw.blockHeight ?? 0;
      const date = new Date((raw.timestamp ?? 0) * 1000);
      const failed = raw.status !== "success";
      
      return {
        id: raw.txHash ?? "",
        type,
        value,
        asset: { type: "native" },
        senders: raw.sender ? [raw.sender] : [],
        recipients: raw.receiver ? [raw.receiver] : [],
        tx: { hash: raw.txHash ?? "", block: { height }, fees, date, failed },
      };
    }
    ```

- [ ] **Task 3b: Create logic/common.ts** *(Pending)*
  - File: `libs/coin-modules/coin-multiversx/src/logic/common.ts`
  - Action: Create shared utilities for delegation state mapping
  - Details:
    ```typescript
    import { isValidAddress as validateAddr } from "../logic";
    
    export function validateAddress(address: string): boolean {
      return validateAddr(address);
    }
    
    export function mapDelegationState(delegation: MultiversXDelegation): StakeState {
      if (delegation.userUndelegatedList.length > 0) {
        return "deactivating";
      }
      if (BigInt(delegation.userActiveStake) > 0n) {
        return "active";
      }
      return "inactive";
    }
    ```

- [ ] **Task 4: Create logic/lastBlock.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/lastBlock.ts`
  - Action: Get current block height
  - Source: Adapt from `api.getBlockchainBlockHeight()`
  - Details:
    ```typescript
    import MultiversXApi from "../api/apiCalls";
    import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
    
    export async function lastBlock(api: MultiversXApi): Promise<BlockInfo> {
      const height = await api.getBlockchainBlockHeight();
      return { height };
    }
    ```

- [ ] **Task 5: Create logic/getBalance.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/getBalance.ts`
  - Action: Get native EGLD + ESDT token balances
  - Source: Combine `getAccount()` + `getAccountESDTTokens()`
  - **Critical**: Return `[{ value: 0n, asset: { type: "native" } }]` for empty accounts
  - Details:
    ```typescript
    import MultiversXApi from "../api/apiCalls";
    import type { Balance } from "@ledgerhq/coin-framework/api/index";
    
    export async function getBalance(api: MultiversXApi, address: string): Promise<Balance[]> {
      const balances: Balance[] = [];
      
      // Fetch native balance - ALWAYS return even if 0
      const { balance } = await api.getAccountDetails(address);
      balances.push({
        value: BigInt(balance),
        asset: { type: "native" },
      });
      
      // Fetch ESDT tokens
      const tokens = await api.getESDTTokensForAddress(address);
      for (const token of tokens) {
        balances.push({
          value: BigInt(token.balance),
          asset: { 
            type: "esdt", 
            assetReference: token.identifier,
            name: token.name,
          },
        });
      }
      
      return balances;
    }
    ```

- [ ] **Task 6: Create logic/getSequence.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/getSequence.ts`
  - Action: Get account nonce
  - Source: Adapt from `getAccountNonce()`
  - Details:
    ```typescript
    import { Address, ApiNetworkProvider } from "@multiversx/sdk-core";
    
    export async function getSequence(proxy: ApiNetworkProvider, address: string): Promise<bigint> {
      const addr = new Address(address);
      const account = await proxy.getAccount(addr);
      return BigInt(account.nonce.valueOf());
    }
    ```

- [x] **Task 7: Create logic/listOperations.ts** *(Completed in Story 2.1)*
  - File: `libs/coin-modules/coin-multiversx/src/logic/listOperations.ts`
  - Action: List EGLD operations with pagination support
  - Source: Uses `apiClient.getHistory()` from `apiCalls.ts`
  - **API Endpoint**: Uses `MULTIVERSX_API_ENDPOINT` env var (default: `https://elrond.coin.ledger.com`)
  - **Implementation Notes**:
    - Validates address format using `isValidAddress()` from `logic.ts`
    - Calls `apiClient.getHistory(address, startAt)` to fetch EGLD transactions
    - `getHistory()` internally handles pagination via MultiversX API (`/accounts/{addr}/transactions`)
    - Sorts transactions by block height (ascending or descending based on `order` parameter)
    - Applies client-side limit via `Array.slice()`
    - Maps transactions using `mapToOperation()` to convert to Alpaca `Operation` type
    - Returns `[Operation[], string]` tuple where string is next cursor (block height)
  - **ESDT Support**: Deferred to Story 2.2 - will add `getESDTTransactionsForAddress()` integration
  - Details:
    ```typescript
    import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";
    import { isValidAddress } from "../logic";
    import { mapToOperation } from "./mappers";
    
    export async function listOperations(
      apiClient: ApiClient,
      address: string,
      pagination: Pagination,
    ): Promise<[Operation[], string]> {
      if (!isValidAddress(address)) {
        throw new Error(`Invalid MultiversX address: ${address}`);
      }
      
      const { limit, minHeight = 0, order = "desc" } = pagination;
      const transactions = await apiClient.getHistory(address, minHeight);
      
      // Sort by block height
      const sorted = [...transactions].sort((a, b) => {
        const heightA = a.round ?? a.blockHeight ?? 0;
        const heightB = b.round ?? b.blockHeight ?? 0;
        return order === "asc" ? heightA - heightB : heightB - heightA;
      });
      
      // Apply limit and map to Operations
      const limited = limit ? sorted.slice(0, limit) : sorted;
      const operations = limited.map(tx => mapToOperation(tx, address));
      
      // Generate next cursor
      let nextCursor = "";
      if (limit && limited.length === limit && sorted.length > limit) {
        nextCursor = operations[operations.length - 1].tx.block.height.toString();
      }
      
      return [operations, nextCursor];
    }
    ```

- [ ] **Task 8: Create logic/getStakes.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/getStakes.ts`
  - Action: Get delegation positions as Stakes
  - Source: Adapt from `getAccountDelegations()`
  - Details:
    ```typescript
    import MultiversXApi from "../api/apiCalls";
    import type { Page, Stake } from "@ledgerhq/coin-framework/api/index";
    import { mapDelegationState } from "./common";
    
    export async function getStakes(
      api: MultiversXApi,
      delegationApi: string,
      address: string
    ): Promise<Page<Stake>> {
      const delegations = await api.getAccountDelegations(address);
      
      const stakes: Stake[] = delegations.map(d => ({
        uid: `${address}-${d.contract}`,
        address: address,
        delegate: d.contract,
        state: mapDelegationState(d),
        asset: { type: "native" },
        amount: BigInt(d.userActiveStake) + BigInt(d.claimableRewards),
        amountDeposited: BigInt(d.userActiveStake),
        amountRewarded: BigInt(d.claimableRewards),
        details: {
          userUnBondable: d.userUnBondable,
          userUndelegatedList: d.userUndelegatedList,
        },
      }));
      
      return { items: stakes, next: undefined };
    }
    ```

- [ ] **Task 9: Create logic/getValidators.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/getValidators.ts`
  - Action: Get staking providers as Validators
  - Source: Adapt from `getProviders()`
  - Details:
    ```typescript
    import MultiversXApi from "../api/apiCalls";
    import type { Page, Validator } from "@ledgerhq/coin-framework/api/index";
    
    export async function getValidators(api: MultiversXApi): Promise<Page<Validator>> {
      const providers = await api.getProviders();
      
      const validators: Validator[] = providers
        .filter(p => !p.disabled)
        .map(p => ({
          address: p.contract,
          name: p.identity?.name || p.contract,
          description: p.identity?.description,
          url: p.identity?.url,
          logo: p.identity?.avatar,
          balance: BigInt(p.totalActiveStake),
          commissionRate: p.serviceFee,
          apy: p.aprValue / 100, // Convert from percentage to decimal
        }));
      
      return { items: validators, next: undefined };
    }
    ```

- [ ] **Task 10: Create logic/estimateFees.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/estimateFees.ts`
  - Action: Estimate transaction fees
  - Source: Adapt from `getFees()` in sdk.ts
  - Details:
    ```typescript
    import { GAS, GAS_PRICE } from "../constants";
    import type { MultiversXFeeEstimation } from "../types/model";
    import type { TransactionIntent, MemoNotSupported, TxDataNotSupported } from "@ledgerhq/coin-framework/api/index";
    
    export function estimateFees(
      intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>
    ): MultiversXFeeEstimation {
      // Determine gas limit based on transaction type
      let gasLimit: number;
      
      if (intent.asset?.type === "esdt") {
        gasLimit = GAS.ESDT_TRANSFER;
      } else if (intent.type === "delegate" || intent.type === "unDelegate") {
        gasLimit = GAS.DELEGATE;
      } else if (intent.type === "claimRewards") {
        gasLimit = GAS.CLAIM;
      } else {
        gasLimit = 50000; // MIN_GAS_LIMIT for simple transfer
      }
      
      const fee = BigInt(gasLimit) * BigInt(GAS_PRICE);
      
      return {
        value: fee,
        parameters: {
          gasLimit: BigInt(gasLimit),
          gasPrice: BigInt(GAS_PRICE),
        },
      };
    }
    ```

- [ ] **Task 11: Create logic/craftTransaction.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/craftTransaction.ts`
  - Action: Create unsigned transaction
  - Source: Adapt from `doBuildTransactionToSign()` in buildTransaction.ts
  - Details:
    ```typescript
    import { CHAIN_ID, GAS_PRICE, TRANSACTION_VERSION_DEFAULT, TRANSACTION_OPTIONS_TX_HASH_SIGN } from "../constants";
    import { MultiversXEncodeTransaction } from "../encode";
    import type { CraftTransactionInput } from "../types/model";
    import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
    
    export function craftTransaction(input: CraftTransactionInput): CraftedTransaction {
      const { sender, recipient, amount, nonce, gasLimit, mode, tokenIdentifier } = input;
      
      // Encode data based on mode
      let data: string | undefined;
      let value = amount.toString();
      let finalRecipient = recipient;
      
      if (tokenIdentifier) {
        // ESDT transfer
        const tokenHex = Buffer.from(tokenIdentifier).toString("hex");
        let amountHex = amount.toString(16);
        if (amountHex.length % 2 !== 0) amountHex = "0" + amountHex;
        data = Buffer.from(`ESDTTransfer@${tokenHex}@${amountHex}`).toString("base64");
        value = "0"; // Value is 0 for ESDT transfers
      } else {
        switch (mode) {
          case "delegate":
            data = MultiversXEncodeTransaction.delegate();
            break;
          case "unDelegate":
            let amountHex = amount.toString(16);
            if (amountHex.length % 2 !== 0) amountHex = "0" + amountHex;
            data = Buffer.from(`unDelegate@${amountHex}`).toString("base64");
            value = "0";
            break;
          case "claimRewards":
            data = MultiversXEncodeTransaction.claimRewards();
            value = "0";
            break;
          case "withdraw":
            data = MultiversXEncodeTransaction.withdraw();
            value = "0";
            break;
          case "reDelegateRewards":
            data = MultiversXEncodeTransaction.reDelegateRewards();
            value = "0";
            break;
          case "send":
          default:
            // No data for simple send
            break;
        }
      }
      
      const tx = {
        nonce,
        value,
        receiver: finalRecipient,
        sender,
        gasPrice: GAS_PRICE,
        gasLimit: gasLimit ?? 50000,
        ...(data ? { data } : {}),
        chainID: CHAIN_ID,
        version: TRANSACTION_VERSION_DEFAULT,
        options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
      };
      
      return {
        transaction: JSON.stringify(tx),
        details: tx,
      };
    }
    ```

- [ ] **Task 12: Create logic/combine.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/combine.ts`
  - Action: Combine unsigned transaction with signature
  - Details:
    ```typescript
    import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
    
    export function combine(unsignedTx: string, signature: string): string {
      const tx = JSON.parse(unsignedTx);
      
      // Add signature to transaction
      const signedTx = {
        ...tx,
        signature,
      };
      
      return JSON.stringify(signedTx);
    }
    ```

- [ ] **Task 13: Create logic/broadcast.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/broadcast.ts`
  - Action: Broadcast signed transaction
  - Source: Adapt from `api.submit()`
  - Details:
    ```typescript
    import MultiversXApi from "../api/apiCalls";
    
    export async function broadcast(api: MultiversXApi, signedTx: string): Promise<string> {
      const tx = JSON.parse(signedTx);
      
      // Submit expects a specific format
      const result = await api.submit({
        rawData: tx,
        signature: tx.signature,
      } as any);
      
      return result;
    }
    ```

- [ ] **Task 14: Create logic/validateIntent.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/validateIntent.ts`
  - Action: Validate transaction intent
  - Source: Adapt from `getTransactionStatus.ts`
  - Details:
    ```typescript
    import { validateAddress } from "./common";
    import { MIN_DELEGATION_AMOUNT } from "../constants";
    import type { TransactionIntent, TransactionValidation, Balance } from "@ledgerhq/coin-framework/api/index";
    import type { MultiversXFeeEstimation } from "../types/model";
    
    export function validateIntent(
      intent: TransactionIntent,
      balances: Balance[],
      customFees?: MultiversXFeeEstimation
    ): TransactionValidation {
      const errors: Record<string, Error> = {};
      const warnings: Record<string, Error> = {};
      
      // Validate recipient
      if (!intent.recipient) {
        errors.recipient = new Error("Recipient required");
      } else if (!validateAddress(intent.recipient)) {
        errors.recipient = new Error("Invalid recipient address");
      } else if (intent.sender === intent.recipient) {
        errors.recipient = new Error("Cannot send to self");
      }
      
      // Validate sender
      if (!intent.sender || !validateAddress(intent.sender)) {
        errors.sender = new Error("Invalid sender address");
      }
      
      // Validate amount
      if (intent.amount <= 0n && !intent.useAllAmount) {
        errors.amount = new Error("Amount required");
      }
      
      // Check delegation minimum
      if (intent.type === "delegate" || intent.type === "unDelegate") {
        if (intent.amount < BigInt(MIN_DELEGATION_AMOUNT.toString())) {
          errors.amount = new Error("Minimum delegation is 1 EGLD");
        }
      }
      
      // Get balances
      const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;
      const fees = customFees?.value ?? 0n;
      
      // Check balance
      const isTokenTransfer = intent.asset?.type === "esdt";
      if (isTokenTransfer) {
        const tokenBalance = balances.find(
          b => b.asset.type === "esdt" && b.asset.assetReference === intent.asset?.assetReference
        )?.value ?? 0n;
        
        if (intent.amount > tokenBalance) {
          errors.amount = new Error("Insufficient token balance");
        }
        if (fees > nativeBalance) {
          errors.amount = new Error("Insufficient EGLD for fees");
        }
      } else {
        const totalSpent = intent.amount + fees;
        if (totalSpent > nativeBalance) {
          errors.amount = new Error("Insufficient balance");
        }
      }
      
      return {
        errors,
        warnings,
        estimatedFees: fees,
        amount: intent.amount,
        totalSpent: intent.amount + fees,
      };
    }
    ```

- [ ] **Task 15: Create logic/index.ts**
  - File: `libs/coin-modules/coin-multiversx/src/logic/index.ts`
  - Action: Export all logic functions
  - Details:
    ```typescript
    export { broadcast } from "./broadcast";
    export { combine } from "./combine";
    export { craftTransaction } from "./craftTransaction";
    export { estimateFees } from "./estimateFees";
    export { getBalance } from "./getBalance";
    export { getSequence } from "./getSequence";
    export { getStakes } from "./getStakes";
    export { getValidators } from "./getValidators";
    export { lastBlock } from "./lastBlock";
    export { listOperations } from "./listOperations";
    export { validateIntent } from "./validateIntent";
    export * from "./common";
    ```

#### Phase 3: API Layer

- [ ] **Task 16: Rewrite api/index.ts with createApi**
  - File: `libs/coin-modules/coin-multiversx/src/api/index.ts`
  - Action: Implement Alpaca API interface with `createApi()` factory
  - Details:
    ```typescript
    import type { 
      Api, Block, BlockInfo, Cursor, Page, Validator, Stake, 
      FeeEstimation, Operation, Pagination, CraftedTransaction,
      TransactionIntent, MemoNotSupported, TxDataNotSupported,
      TransactionValidation, Balance
    } from "@ledgerhq/coin-framework/api/index";
    import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
    import { ApiNetworkProvider } from "@multiversx/sdk-core";
    import MultiversXApi from "./apiCalls";
    import {
      broadcast as doBroadcast,
      combine as doCombine,
      craftTransaction as doCraftTransaction,
      estimateFees as doEstimateFees,
      getBalance as doGetBalance,
      getSequence as doGetSequence,
      getStakes as doGetStakes,
      getValidators as doGetValidators,
      lastBlock as doLastBlock,
      listOperations as doListOperations,
      validateIntent as doValidateIntent,
    } from "../logic";
    import type { MultiversXApi as MultiversXApiType } from "./types";
    
    export interface MultiversXConfig {
      apiEndpoint: string;
      delegationApiEndpoint: string;
    }
    
    export function createApi(config: MultiversXConfig): MultiversXApiType {
      const api = new MultiversXApi(config.apiEndpoint, config.delegationApiEndpoint);
      const proxy = new ApiNetworkProvider(config.apiEndpoint, { clientName: "ledger-live" });
      
      return {
        // AlpacaApi methods
        broadcast: (tx) => doBroadcast(api, tx),
        combine: doCombine,
        estimateFees: doEstimateFees,
        craftTransaction: async (intent, customFees) => {
          if (!isSendTransactionIntent(intent)) {
            throw new Error("Only send/staking intents supported");
          }
          const nonce = await doGetSequence(proxy, intent.sender);
          const fees = customFees ?? doEstimateFees(intent);
          
          return doCraftTransaction({
            sender: intent.sender,
            recipient: intent.recipient,
            amount: intent.amount,
            nonce: Number(nonce),
            gasLimit: fees.parameters?.gasLimit ? Number(fees.parameters.gasLimit) : undefined,
            mode: (intent.type as any) || "send",
            tokenIdentifier: intent.asset?.type === "esdt" ? intent.asset.assetReference : undefined,
          });
        },
        craftRawTransaction: () => {
          throw new Error("craftRawTransaction is not supported for MultiversX");
        },
        getBalance: (address) => doGetBalance(api, address),
        lastBlock: () => doLastBlock(api),
        getBlockInfo: () => {
          throw new Error("getBlockInfo is not supported for MultiversX");
        },
        getBlock: () => {
          throw new Error("getBlock is not supported for MultiversX");
        },
        listOperations: (address, pagination) => doListOperations(api, address, pagination),
        getStakes: (address) => doGetStakes(api, config.delegationApiEndpoint, address),
        getRewards: () => {
          throw new Error("getRewards is not supported for MultiversX");
        },
        getValidators: () => doGetValidators(api),
        
        // BridgeApi methods
        validateIntent: (intent, balances, customFees) => 
          Promise.resolve(doValidateIntent(intent, balances, customFees)),
        getSequence: (address) => doGetSequence(proxy, address),
      };
    }
    
    // Re-export SDK functions for backward compatibility
    export * from "./sdk";
    ```

#### Phase 4: Package Configuration

- [ ] **Task 17: Update package.json exports**
  - File: `libs/coin-modules/coin-multiversx/package.json`
  - Action: Add `./logic` and update `./api` exports
  - Details:
    ```json
    {
      "exports": {
        ".": { "require": "./lib/cjs/index.js", "default": "./lib/esm/index.js" },
        "./api": { "require": "./lib/cjs/api/index.js", "default": "./lib/esm/api/index.js" },
        "./logic": { "require": "./lib/cjs/logic/index.js", "default": "./lib/esm/logic/index.js" },
        "./bridge": { "require": "./lib/cjs/bridge/js.js", "default": "./lib/esm/bridge/js.js" },
        "./signer": { "require": "./lib/cjs/signer.js", "default": "./lib/esm/signer.js" }
      }
    }
    ```

#### Phase 5: Unit Tests

- [ ] **Task 18: Create logic/getBalance.test.ts**
  - Tests: Empty account (must return `[{ value: 0n, asset: { type: "native" } }]`), native only, native + tokens

- [x] **Task 19: Create logic/listOperations.test.ts** *(Completed in Story 2.1)*
  - File: `libs/coin-modules/coin-multiversx/src/logic/listOperations.test.ts`
  - Tests: 15 unit tests covering pagination, empty results, address validation, cursor generation, operation mapping, sorting

- [ ] **Task 20: Create logic/getStakes.test.ts**
  - Tests: No delegations, single delegation, multiple delegations, undelegating state

- [ ] **Task 21: Create logic/getValidators.test.ts**
  - Tests: Empty list, multiple validators with identity, disabled validators filtered

- [ ] **Task 22: Create logic/craftTransaction.test.ts**
  - Tests: Native EGLD transfer, ESDT token transfer, delegate, unDelegate, claimRewards

- [ ] **Task 23: Create logic/combine.test.ts**
  - Tests: Valid signature combination, preserves transaction fields

- [ ] **Task 24: Create logic/estimateFees.test.ts**
  - Tests: Native transfer, ESDT transfer, delegation

- [ ] **Task 25: Create logic/validateIntent.test.ts**
  - Tests: Valid intent, missing recipient, invalid address, insufficient balance, self-send, minimum delegation

- [ ] **Task 26: Create logic/common.test.ts**
  - Tests: Address validation, delegation state mapping

#### Phase 6: Integration Tests

- [x] **Task 27: Create api/index.integ.test.ts** *(Partially completed - Epic 1 + Story 2.1)*
  - File: `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts`
  - Action: Integration tests against real MultiversX mainnet (Ledger proxy: `https://elrond.coin.ledger.com`)
  - **Completed Tests:**
    - ✅ `getBalance` - Real address with EGLD (6 tests)
    - ✅ `getBalance` - Real address with ESDT tokens
    - ✅ `getBalance` - Empty account (verify returns element with 0)
    - ✅ `getSequence` - Real address nonce (6 tests)
    - ✅ `lastBlock` - Current block height (2 tests)
    - ✅ `listOperations` - Address with transaction history (8 tests in Story 2.1)
  - **Pending Tests:**
    - `getStakes` - Address with delegations
    - `getValidators` - Fetch all providers
    - `craftTransaction` - Native transfer (verify JSON structure)
    - `craftTransaction` - ESDT transfer (verify data encoding)
    - `combine` - Combine with mock signature
    - `estimateFees` - Various transaction types
    - `broadcast` - **EXCLUDED** (requires real signature)

#### Phase 7: Documentation

- [ ] **Task 28: Update README.md**
  - File: `libs/coin-modules/coin-multiversx/README.md`
  - Action: Document `createApi()` usage
  - Details:
    ```markdown
    ## Alpaca API
    
    The module exports a `createApi()` factory for the standardized Alpaca API:
    
    ```typescript
    import { createApi } from "@ledgerhq/coin-multiversx/api";
    
    const api = createApi({
      apiEndpoint: "https://elrond.coin.ledger.com",
      delegationApiEndpoint: "https://delegations-elrond.coin.ledger.com",
    });
    
    // Get balance (native EGLD + ESDT tokens)
    const balances = await api.getBalance("erd1...");
    
    // Get staking positions
    const { items: stakes } = await api.getStakes("erd1...");
    
    // Get validators
    const { items: validators } = await api.getValidators();
    ```
    ```

- [ ] **Task 29: Add JSDoc to public API functions**
  - Action: Add inline documentation to all exported functions in `api/index.ts`

### Acceptance Criteria

#### API Implementation

- [ ] **AC 1**: `getBalance()` returns `Balance[]` with native EGLD + ESDT tokens
- [ ] **AC 2**: `getBalance()` returns `[{ value: 0n, asset: { type: "native" } }]` for empty accounts (never empty array)
- [x] **AC 3**: `listOperations()` returns EGLD operations sorted by block height *(Story 2.1 - ESDT in Story 2.2)*
- [ ] **AC 4**: `getStakes()` maps delegations to `Stake[]` with correct state
- [ ] **AC 5**: `getValidators()` returns providers mapped to `Validator[]` with APR, identity
- [ ] **AC 6**: `getRewards()` throws "not supported" error
- [ ] **AC 7**: `lastBlock()` returns current block height
- [ ] **AC 8**: `craftTransaction()` works for native EGLD transfers
- [ ] **AC 9**: `craftTransaction()` works for ESDT token transfers with correct encoding
- [ ] **AC 10**: `craftTransaction()` works for delegation modes (delegate, unDelegate, etc.)
- [ ] **AC 11**: `estimateFees()` returns gas-based fee estimation with parameters
- [ ] **AC 12**: `broadcast()` submits signed transaction and returns hash
- [ ] **AC 13**: `combine()` combines unsigned transaction with signature
- [ ] **AC 14**: `validateIntent()` validates transaction and returns errors/warnings
- [ ] **AC 15**: `getSequence()` returns account nonce as `bigint`
- [ ] **AC 16**: `craftRawTransaction()`, `getBlock()`, `getBlockInfo()` throw "not supported"

#### Testing

- [ ] **AC 17**: Unit tests achieve 100% coverage for `logic/` functions
- [ ] **AC 18**: Integration tests pass for all implemented API methods
- [ ] **AC 19**: Existing bridge tests continue passing (no regressions)

#### Documentation

- [ ] **AC 20**: README documents `createApi()` usage with examples
- [ ] **AC 21**: Public API functions have JSDoc comments

## Additional Context

### Test Addresses (Mainnet)

Use these addresses for integration tests:

| Purpose | Address |
|---------|---------|
| Has EGLD balance | `erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th` |
| Has ESDT tokens | TBD (find address with tokens) |
| Has delegations | TBD (find address with active delegation) |
| Empty account | Generate new address or use known empty |

### Running Tests

```bash
# Unit tests
pnpm coin:multiversx test

# Integration tests (requires network)
pnpm coin:multiversx test-integ

# Coverage report
pnpm coin:multiversx test --coverage
```

### References

- **Filecoin Migration**: `_bmad-output/implementation-artifacts/tech-spec-migrate-coin-filecoin-to-alpaca-model.md`
- **Api Interface**: `libs/coin-framework/src/api/types.ts`
- **Product Brief**: `_bmad-output/planning-artifacts/product-brief-ledger-live-2026-01-29.md`
