---
title: 'Migrate coin-filecoin to Alpaca Model'
slug: 'migrate-coin-filecoin-to-alpaca-model'
created: '2026-01-27'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - TypeScript
  - '@ledgerhq/coin-framework'
  - '@ledgerhq/coin-framework/api'
  - iso-filecoin
  - bignumber.js
  - rxjs
  - ethers (for ERC20 ABI encoding)
  - '@zondax/cbor'
files_to_modify:
  - libs/coin-modules/coin-filecoin/src/logic/index.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/broadcast.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/combine.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/craftTransaction.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/estimateFees.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/getBalance.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/lastBlock.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/listOperations.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/validateIntent.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/validateAddress.ts (create)
  - libs/coin-modules/coin-filecoin/src/logic/common.ts (create)
  - libs/coin-modules/coin-filecoin/src/api/index.ts (rewrite)
  - libs/coin-modules/coin-filecoin/src/bridge/index.ts (refactor)
  - libs/coin-modules/coin-filecoin/src/types/model.ts (create)
  - libs/coin-modules/coin-filecoin/package.json (update exports)
code_patterns:
  - 'Alpaca API pattern: createApi(config) returns Api<MemoType>'
  - 'Logic module: Pure functions consuming network layer'
  - 'Bridge consumes logic functions via framework helpers'
  - 'Network types stay private to network module'
  - 'Api/Bridge types defined in types/ but used only in their module'
test_patterns:
  - 'Unit tests: *.test.ts next to source files'
  - 'Integration tests: *.integ.test.ts for API layer'
  - 'Mock network calls, test logic independently'
  - 'Use fixtures for test data'
---

# Tech-Spec: Migrate coin-filecoin to Alpaca Model

**Created:** 2026-01-27

## Overview

### Problem Statement

The coin-filecoin module uses the traditional bridge-only pattern, making it incompatible with the Alpaca backend service. The current architecture has logic scattered across `bridge/` and `common-logic/` directories, with no standardized API interface for backend services.

### Solution

Restructure coin-filecoin following the Alpaca-compliant architecture pattern:
- Extract core logic into a dedicated `logic/` module
- Implement Alpaca `Api` interface in `api/`
- Both bridge and API consume the same logic functions
- Include ERC20/FVM token support in the API

### Scope

**In Scope:**
- Create `logic/` module with all core blockchain functions
- Implement Alpaca API interface (`api/index.ts` with `createApi`)
- Include ERC20/FVM token balance and operations in API
- Refactor bridge to consume logic functions
- Return "not supported" for unavailable features (staking, rewards, validators)
- No memo support (use MemoNotSupported type)
- Unit tests for logic functions
- Integration tests for API layer
- Maintain full backward compatibility with existing bridge

**Out of Scope:**
- Adding new features not already in bridge (staking, rewards, validators)
- Memo field support
- Changes to Ledger Live integration (setup.ts in ledger-live-common)

## Context for Development

### Codebase Patterns

**Alpaca Architecture (from coin-algorand reference):**
```
coin-module/
├── api/           # Alpaca API interface (createApi)
├── bridge/        # Bridge interface (createBridges)
├── logic/         # Core blockchain logic (shared by api & bridge)
├── network/       # HTTP/RPC communication
├── signer/        # Hardware wallet interface
├── types/         # Type definitions
└── erc20/         # Token support (Filecoin-specific)
```

**Key Principles:**
1. `logic/` functions are blockchain-agnostic (no bridge/api types)
2. `network/` types are private to that module
3. Both `api/` and `bridge/` consume `logic/` functions
4. API returns standardized types from `@ledgerhq/coin-framework/api`

**Alpaca API Interface (from coin-framework):**
```typescript
type Api<MemoType, TxDataType> = AlpacaApi<MemoType, TxDataType> & BridgeApi<MemoType, TxDataType>;

// AlpacaApi methods:
- broadcast(tx: string) => Promise<string>
- combine(tx: string, signature: string, pubkey?: string) => string | Promise<string>
- craftTransaction(intent, customFees?) => Promise<CraftedTransaction>
- craftRawTransaction(...) => Promise<CraftedTransaction>
- estimateFees(intent, customFeesParams?) => Promise<FeeEstimation>
- getBalance(address: string) => Promise<Balance[]>
- lastBlock() => Promise<BlockInfo>
- getBlockInfo(height: number) => Promise<BlockInfo>
- getBlock(height: number) => Promise<Block>
- listOperations(address, pagination) => Promise<[Operation[], string]>
- getStakes(address, cursor?) => Promise<Page<Stake>>
- getRewards(address, cursor?) => Promise<Page<Reward>>
- getValidators(cursor?) => Promise<Page<Validator>>

// BridgeApi methods:
- validateIntent(intent, balances, customFees?) => Promise<TransactionValidation>
- getSequence(address: string) => Promise<bigint>
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `coin-algorand/src/api/index.ts` | Reference Alpaca API implementation |
| `coin-algorand/src/logic/` | Reference logic module structure |
| `coin-tezos/src/api/index.ts` | Full API with getSequence, getStakes, validateIntent |
| `coin-tezos/src/logic/` | Comprehensive logic module with tests |
| `coin-evm/src/logic/getBalance.ts` | Token balance fetching pattern (ERC20) |
| `coin-evm/src/logic/common.ts` | ERC20 ABI encoding with ethers |
| `coin-evm/src/logic/getTokenFromAsset.ts` | Token ↔ Asset conversion utilities |
| `coin-xrp/src/api/index.ts` | Sequence/nonce handling pattern |
| `coin-tron/src/logic/getBalance.ts` | Multi-asset balance aggregation |
| `coin-filecoin/src/bridge/` | Current bridge implementation (logic to extract) |
| `coin-filecoin/src/common-logic/utils.ts` | Current shared logic (getAccountShape, mapTxToOps) |
| `coin-filecoin/src/api/api.ts` | Current HTTP client (to be kept for network layer) |
| `coin-filecoin/src/erc20/tokenAccounts.ts` | Token account building (for API token support) |
| `coin-filecoin/src/network/addresses.ts` | Address validation/conversion |
| `coin-framework/src/api/types.ts` | API interface definitions |

### Technical Decisions

1. **No memo support**: Filecoin transactions don't have a memo field. Use `MemoNotSupported` type parameter.

2. **ERC20 token support**: 
   - `getBalance()` returns native FIL + FVM token balances
   - `listOperations()` includes token transfer operations
   - Token balances fetched via existing `fetchERC20TokenBalance` API

3. **Unsupported features** (throw "not supported" errors):
   - `getStakes()` - Filecoin has no staking
   - `getRewards()` - Filecoin has no staking rewards
   - `getValidators()` - Filecoin validators not exposed via API
   - `craftRawTransaction()` - Not needed for Filecoin
   - `getBlock()` / `getBlockInfo()` - Block details not available via current API

4. **Transaction crafting**: 
   - Uses CBOR serialization via `iso-filecoin/message`
   - Supports native FIL transfers and ERC20 token transfers
   - Method: `Transfer` (0) for native, `InvokeEVM` (3844450837) for tokens

5. **Backward compatibility**: 
   - Bridge continues to work via `createBridges(signerContext)`
   - Bridge refactored to consume `logic/` functions
   - No changes to `ledger-live-common/families/filecoin/setup.ts`

6. **Fee estimation with parameters**:
   - Return `FilecoinFeeEstimation` with `parameters` object containing `gasFeeCap`, `gasPremium`, `gasLimit`
   - Similar pattern to coin-tezos `TezosFeeEstimation`

## Implementation Plan

### Tasks

#### Phase 1: Types & Foundation

- [ ] **Task 1: Create API model types**
  - File: `libs/coin-modules/coin-filecoin/src/types/model.ts`
  - Action: Create types for Alpaca API layer
  - Details:
    ```typescript
    // FilecoinFeeEstimation extends FeeEstimation with gas parameters
    export interface FilecoinFeeEstimation extends FeeEstimation {
      parameters?: {
        gasFeeCap: bigint;
        gasPremium: bigint;
        gasLimit: bigint;
      };
    }
    
    // ListOperationsOptions for pagination
    export interface ListOperationsOptions {
      limit?: number;
      minHeight?: number;
      order?: "asc" | "desc";
      token?: string;
    }
    
    // CraftTransactionInput for transaction crafting
    export interface CraftTransactionInput {
      sender: string;
      recipient: string;
      amount: bigint;
      nonce: number;
      gasFeeCap?: bigint;
      gasPremium?: bigint;
      gasLimit?: bigint;
      // Token transfer fields
      tokenContractAddress?: string;
    }
    ```

- [ ] **Task 2: Update types/index.ts exports**
  - File: `libs/coin-modules/coin-filecoin/src/types/index.ts`
  - Action: Add exports for new model types
  - Details: `export * from "./model";`

#### Phase 2: Logic Module (Core Functions)

- [ ] **Task 3: Create logic/validateAddress.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/validateAddress.ts`
  - Action: Wrap existing `network/addresses.ts` validation
  - Source: Extract from `network/addresses.ts`
  - Details:
    ```typescript
    import { validateAddress as networkValidateAddress } from "../network/addresses";
    
    export function validateAddress(address: string): boolean {
      return networkValidateAddress(address).isValid;
    }
    ```

- [ ] **Task 4: Create logic/common.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/common.ts`
  - Action: Create shared utilities and constants
  - Source: Extract from `bridge/utils.ts`
  - Details:
    - Move `Methods` enum
    - Move `calculateEstimatedFees()` function
    - Add `FILECOIN_BASE_FEE` constant
    - Add helper functions for gas calculations

- [ ] **Task 5: Create logic/lastBlock.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/lastBlock.ts`
  - Action: Get current block height
  - Source: Extract from `api/api.ts` (`fetchBlockHeight`)
  - Details:
    ```typescript
    import { fetchBlockHeight } from "../api/api";
    import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";
    
    export async function lastBlock(): Promise<BlockInfo> {
      const status = await fetchBlockHeight();
      return { height: status.current_block_height };
    }
    ```

- [ ] **Task 6: Create logic/getBalance.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/getBalance.ts`
  - Action: Get native + token balances
  - Source: Combine `api/api.ts` (`fetchBalances`) and `erc20/tokenAccounts.ts`
  - Details:
    ```typescript
    import { fetchBalances, fetchERC20TokenBalance } from "../api/api";
    import type { Balance } from "@ledgerhq/coin-framework/api/index";
    
    export async function getBalance(address: string, tokenContracts?: string[]): Promise<Balance[]> {
      const balances: Balance[] = [];
      
      // Fetch native balance
      const nativeBalance = await fetchBalances(address);
      balances.push({
        value: BigInt(nativeBalance.spendable_balance),
        asset: { type: "native" },
      });
      
      // Fetch token balances if contract addresses provided
      if (tokenContracts) {
        for (const contract of tokenContracts) {
          const tokenBalance = await fetchERC20TokenBalance(contract, address);
          balances.push({
            value: BigInt(tokenBalance),
            asset: { type: "erc20", contractAddress: contract },
          });
        }
      }
      
      return balances;
    }
    ```

- [ ] **Task 7: Create logic/estimateFees.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/estimateFees.ts`
  - Action: Estimate transaction fees
  - Source: Extract from `api/api.ts` (`fetchEstimatedFees`) and `bridge/utils.ts`
  - Details:
    ```typescript
    import { fetchEstimatedFees } from "../api/api";
    import { calculateEstimatedFees } from "./common";
    import type { FilecoinFeeEstimation } from "../types/model";
    
    export async function estimateFees(
      sender: string,
      recipient: string,
      amount: bigint,
      method: number = 0,
      params?: string
    ): Promise<FilecoinFeeEstimation> {
      const estimation = await fetchEstimatedFees({
        from: sender,
        to: recipient,
        method,
        params,
      });
      
      const value = calculateEstimatedFees(
        BigInt(estimation.gas_fee_cap),
        BigInt(estimation.gas_limit)
      );
      
      return {
        value,
        parameters: {
          gasFeeCap: BigInt(estimation.gas_fee_cap),
          gasPremium: BigInt(estimation.gas_premium),
          gasLimit: BigInt(estimation.gas_limit),
        },
      };
    }
    ```

- [ ] **Task 8: Create logic/craftTransaction.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/craftTransaction.ts`
  - Action: Create unsigned transaction
  - Source: Extract from `bridge/serializer.ts` and `bridge/prepareTransaction.ts`
  - Details:
    ```typescript
    import { Message } from "iso-filecoin/message";
    import { validateAddress } from "../network/addresses";
    import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
    import { Methods } from "./common";
    import type { CraftTransactionInput } from "../types/model";
    import type { CraftedTransaction } from "@ledgerhq/coin-framework/api/index";
    
    export async function craftTransaction(input: CraftTransactionInput): Promise<CraftedTransaction> {
      const { sender, recipient, amount, nonce, gasFeeCap, gasPremium, gasLimit, tokenContractAddress } = input;
      
      // Validate addresses
      if (!validateAddress(sender).isValid) throw new Error("Invalid sender address");
      if (!validateAddress(recipient).isValid) throw new Error("Invalid recipient address");
      
      // Determine method and params for token vs native transfer
      let method = Methods.Transfer;
      let params = "";
      let finalRecipient = recipient;
      let finalAmount = amount;
      
      if (tokenContractAddress) {
        method = Methods.InvokeEVM;
        params = encodeTxnParams(generateTokenTxnParams(recipient, amount.toString()));
        finalRecipient = tokenContractAddress;
        finalAmount = 0n;
      }
      
      // Build Filecoin message
      const message = new Message({
        version: 0,
        from: sender,
        to: finalRecipient,
        value: finalAmount.toString(),
        method,
        nonce,
        gasFeeCap: gasFeeCap?.toString() ?? "0",
        gasPremium: gasPremium?.toString() ?? "0",
        gasLimit: Number(gasLimit ?? 0),
        params,
      });
      
      const cborHex = message.serialize();
      
      return {
        transaction: cborHex,
        details: {
          nonce,
          method,
          gasFeeCap: gasFeeCap?.toString(),
          gasPremium: gasPremium?.toString(),
          gasLimit: gasLimit?.toString(),
        },
      };
    }
    ```

- [ ] **Task 9: Create logic/combine.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/combine.ts`
  - Action: Combine unsigned transaction with signature
  - Source: Extract from `bridge/signOperation.ts`
  - Details:
    ```typescript
    export function combine(unsignedTx: string, signature: string): string {
      // Filecoin signed transaction format:
      // The signature is appended to the CBOR-encoded message
      // Format: { Message: <cbor>, Signature: { Type: 1, Data: <base64sig> } }
      
      const signatureBase64 = Buffer.from(signature, "hex").toString("base64");
      
      // Combine message + signature into signed transaction JSON
      const signedTx = JSON.stringify({
        Message: unsignedTx,
        Signature: {
          Type: 1, // secp256k1
          Data: signatureBase64,
        },
      });
      
      return signedTx;
    }
    ```

- [ ] **Task 10: Create logic/broadcast.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/broadcast.ts`
  - Action: Broadcast signed transaction
  - Source: Extract from `bridge/broadcast.ts` and `common-logic/utils.ts`
  - Details:
    ```typescript
    import { broadcastTx } from "../api/api";
    
    export async function broadcast(signedTx: string): Promise<string> {
      const result = await broadcastTx(JSON.parse(signedTx));
      return result.txHash;
    }
    ```

- [ ] **Task 11: Create logic/listOperations.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/listOperations.ts`
  - Action: List operations with pagination (native + tokens)
  - Source: Extract from `common-logic/utils.ts` (`mapTxToOps`, `getAccountShape`)
  - Details:
    ```typescript
    import { fetchTxsWithPages, fetchERC20TransactionsWithPages } from "../api/api";
    import type { Operation } from "@ledgerhq/coin-framework/api/index";
    import type { ListOperationsOptions } from "../types/model";
    
    export async function listOperations(
      address: string,
      options: ListOperationsOptions
    ): Promise<[Operation[], string]> {
      const { limit = 200, minHeight = 0, order = "asc" } = options;
      
      // Fetch native transactions
      const txs = await fetchTxsWithPages(address, minHeight);
      
      // Map to operations
      const operations: Operation[] = txs.map(tx => mapTxToOperation(address, tx));
      
      // Sort by order
      operations.sort((a, b) => {
        const comparison = a.block.height - b.block.height;
        return order === "asc" ? comparison : -comparison;
      });
      
      // Apply limit
      const limitedOps = operations.slice(0, limit);
      
      // Generate next cursor
      const nextCursor = limitedOps.length > 0 
        ? limitedOps[limitedOps.length - 1].block.height.toString()
        : "";
      
      return [limitedOps, nextCursor];
    }
    
    function mapTxToOperation(address: string, tx: TransactionResponse): Operation {
      // ... mapping logic from common-logic/utils.ts mapTxToOps
    }
    ```

- [ ] **Task 12: Create logic/validateIntent.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/validateIntent.ts`
  - Action: Validate transaction intent
  - Source: Extract from `bridge/getTransactionStatus.ts`
  - Details:
    ```typescript
    import { validateAddress } from "./validateAddress";
    import { isRecipientValidForTokenTransfer } from "../network/addresses";
    import type { TransactionIntent, TransactionValidation, Balance } from "@ledgerhq/coin-framework/api/index";
    import type { FilecoinFeeEstimation } from "../types/model";
    
    export async function validateIntent(
      intent: TransactionIntent,
      balances: Balance[],
      customFees?: FilecoinFeeEstimation
    ): Promise<TransactionValidation> {
      const errors: Record<string, Error> = {};
      const warnings: Record<string, Error> = {};
      
      // Validate recipient address
      if (!intent.recipient || !validateAddress(intent.recipient)) {
        errors.recipient = new Error("Invalid recipient address");
      }
      
      // Validate amount
      if (intent.amount <= 0n && !intent.useAllAmount) {
        errors.amount = new Error("Amount must be greater than 0");
      }
      
      // Get native balance
      const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;
      const fees = customFees?.value ?? 0n;
      
      // Validate balance
      const totalSpent = intent.amount + fees;
      if (totalSpent > nativeBalance) {
        errors.amount = new Error("Insufficient balance");
      }
      
      // Token transfer recipient validation
      if (intent.asset?.type === "erc20") {
        if (!isRecipientValidForTokenTransfer(intent.recipient)) {
          errors.recipient = new Error("Invalid recipient for token transfer");
        }
      }
      
      return {
        errors,
        warnings,
        estimatedFees: customFees ?? { value: 0n },
        amount: intent.amount,
        totalSpent,
      };
    }
    ```

- [ ] **Task 13: Create logic/index.ts**
  - File: `libs/coin-modules/coin-filecoin/src/logic/index.ts`
  - Action: Export all logic functions
  - Details:
    ```typescript
    export { broadcast } from "./broadcast";
    export { combine } from "./combine";
    export { craftTransaction } from "./craftTransaction";
    export { estimateFees } from "./estimateFees";
    export { getBalance } from "./getBalance";
    export { lastBlock } from "./lastBlock";
    export { listOperations } from "./listOperations";
    export { validateAddress } from "./validateAddress";
    export { validateIntent } from "./validateIntent";
    export * from "./common";
    ```

#### Phase 3: API Layer

- [ ] **Task 14: Create api/types.ts**
  - File: `libs/coin-modules/coin-filecoin/src/api/types.ts`
  - Action: Create API-specific types
  - Details:
    ```typescript
    import type { Api, MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
    import type { FilecoinFeeEstimation } from "../types/model";
    
    export type FilecoinApi = Api<MemoNotSupported> & {
      estimateFees: (...args: Parameters<Api["estimateFees"]>) => Promise<FilecoinFeeEstimation>;
    };
    ```

- [ ] **Task 15: Rewrite api/index.ts with createApi**
  - File: `libs/coin-modules/coin-filecoin/src/api/index.ts`
  - Action: Implement Alpaca API interface
  - Details:
    ```typescript
    import type { Api, Block, BlockInfo, Cursor, Page, Validator, Stake, Reward, 
                  FeeEstimation, Operation, Pagination, CraftedTransaction,
                  TransactionIntent, MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
    import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
    import coinConfig, { type FilecoinConfig } from "../config";
    import {
      broadcast,
      combine,
      craftTransaction,
      estimateFees,
      getBalance,
      lastBlock,
      listOperations,
      validateIntent,
    } from "../logic";
    import { fetchAccountInfo } from "./api";
    import type { FilecoinApi } from "./types";
    import type { ListOperationsOptions } from "../types/model";
    
    export function createApi(config: FilecoinConfig): FilecoinApi {
      coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
      
      return {
        broadcast,
        combine,
        craftTransaction: craft,
        craftRawTransaction,
        estimateFees: estimate,
        getBalance,
        lastBlock,
        listOperations: operations,
        validateIntent,
        getSequence,
        getBlock,
        getBlockInfo,
        getStakes,
        getRewards,
        getValidators,
      };
    }
    
    async function craft(
      transactionIntent: TransactionIntent<MemoNotSupported>,
      customFees?: FeeEstimation
    ): Promise<CraftedTransaction> {
      if (!isSendTransactionIntent(transactionIntent)) {
        throw new Error("Only send transaction intent is supported");
      }
      
      // Get nonce/sequence
      const nonce = await getSequence(transactionIntent.sender);
      
      // Get fees if not provided
      const fees = customFees ?? await estimate(transactionIntent);
      
      // Determine if token transfer
      const tokenContractAddress = 
        transactionIntent.asset?.type === "erc20" 
          ? transactionIntent.asset.contractAddress 
          : undefined;
      
      return craftTransaction({
        sender: transactionIntent.sender,
        recipient: transactionIntent.recipient,
        amount: transactionIntent.amount,
        nonce: Number(nonce),
        gasFeeCap: fees.parameters?.gasFeeCap,
        gasPremium: fees.parameters?.gasPremium,
        gasLimit: fees.parameters?.gasLimit,
        tokenContractAddress,
      });
    }
    
    async function craftRawTransaction(): Promise<CraftedTransaction> {
      throw new Error("craftRawTransaction is not supported for Filecoin");
    }
    
    async function estimate(transactionIntent: TransactionIntent<MemoNotSupported>): Promise<FeeEstimation> {
      const tokenContractAddress = 
        transactionIntent.asset?.type === "erc20" 
          ? transactionIntent.asset.contractAddress 
          : undefined;
      
      return estimateFees(
        transactionIntent.sender,
        transactionIntent.recipient,
        transactionIntent.amount,
        tokenContractAddress ? 3844450837 : 0, // InvokeEVM or Transfer
        tokenContractAddress ? "params" : undefined
      );
    }
    
    async function operations(address: string, pagination: Pagination): Promise<[Operation[], string]> {
      const options: ListOperationsOptions = {
        minHeight: pagination.minHeight,
        order: pagination.order ?? "asc",
        limit: pagination.limit,
        token: pagination.lastPagingToken,
      };
      
      return listOperations(address, options);
    }
    
    async function getSequence(address: string): Promise<bigint> {
      const accountInfo = await fetchAccountInfo(address);
      return BigInt(accountInfo.nonce ?? 0);
    }
    
    function getBlock(_height: number): Promise<Block> {
      throw new Error("getBlock is not supported for Filecoin");
    }
    
    function getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported for Filecoin");
    }
    
    function getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported for Filecoin");
    }
    
    function getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported for Filecoin");
    }
    
    function getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported for Filecoin");
    }
    
    // Re-export HTTP client functions for backward compatibility
    export * from "./api";
    ```

#### Phase 4: Bridge Refactoring

- [ ] **Task 16: Refactor bridge to consume logic functions**
  - File: `libs/coin-modules/coin-filecoin/src/bridge/index.ts`
  - Action: Update bridge to use `logic/` functions where appropriate
  - Details:
    - Import from `../logic` instead of duplicating code
    - Keep hardware signer interactions in bridge
    - Use `craftTransaction` from logic for transaction building
    - Use `validateIntent` logic for `getTransactionStatus`
    - Ensure backward compatibility with `createBridges(signerContext)`

- [ ] **Task 17: Update bridge/prepareTransaction.ts**
  - File: `libs/coin-modules/coin-filecoin/src/bridge/prepareTransaction.ts`
  - Action: Use `estimateFees` from logic
  - Details: Import and use `estimateFees` from `../logic` for fee estimation

- [ ] **Task 18: Update bridge/getTransactionStatus.ts**
  - File: `libs/coin-modules/coin-filecoin/src/bridge/getTransactionStatus.ts`
  - Action: Reuse validation logic from `logic/validateIntent.ts`
  - Details: Extract common validation into logic, keep bridge-specific error formatting

- [ ] **Task 19: Update bridge/broadcast.ts**
  - File: `libs/coin-modules/coin-filecoin/src/bridge/broadcast.ts`
  - Action: Use `broadcast` from logic
  - Details: Keep operation patching in bridge, delegate broadcast to logic

#### Phase 5: Package Configuration

- [ ] **Task 20: Update package.json exports**
  - File: `libs/coin-modules/coin-filecoin/package.json`
  - Action: Add `./logic` export
  - Details:
    ```json
    {
      "exports": {
        ".": { "require": "./lib/cjs/index.js", "default": "./lib/esm/index.js" },
        "./api": { "require": "./lib/cjs/api/index.js", "default": "./lib/esm/api/index.js" },
        "./logic": { "require": "./lib/cjs/logic/index.js", "default": "./lib/esm/logic/index.js" },
        // ... existing exports
      }
    }
    ```

#### Phase 6: Testing

- [ ] **Task 21: Create logic unit tests**
  - Files:
    - `libs/coin-modules/coin-filecoin/src/logic/validateAddress.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/lastBlock.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/getBalance.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/estimateFees.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/craftTransaction.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/combine.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/broadcast.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/listOperations.test.ts`
    - `libs/coin-modules/coin-filecoin/src/logic/validateIntent.test.ts`
  - Action: Create unit tests for each logic function
  - Details: Mock network calls, test happy path and edge cases

- [ ] **Task 22: Create API integration tests**
  - File: `libs/coin-modules/coin-filecoin/src/api/index.test.ts`
  - Action: Create unit tests for createApi
  - Details: Test all API methods, mock logic functions

- [ ] **Task 23: Create API end-to-end integration tests**
  - File: `libs/coin-modules/coin-filecoin/src/api/index.integ.test.ts`
  - Action: Create integration tests with mocked network
  - Details: Test full flow from API to network layer using MSW

- [ ] **Task 24: Verify bridge backward compatibility**
  - File: `libs/coin-modules/coin-filecoin/src/bridge/index.test.ts`
  - Action: Ensure existing bridge tests pass
  - Details: Run existing tests, add tests for logic integration

### Acceptance Criteria

#### Core Logic Module

- [ ] **AC 1**: Given a valid Filecoin address (f1/f3/f4), when `validateAddress()` is called, then it returns `true`
- [ ] **AC 2**: Given an invalid address, when `validateAddress()` is called, then it returns `false`
- [ ] **AC 3**: Given a valid address, when `getBalance()` is called, then it returns an array with native FIL balance
- [ ] **AC 4**: Given an address with token holdings, when `getBalance()` is called with token contracts, then it returns both native and token balances
- [ ] **AC 5**: Given network is available, when `lastBlock()` is called, then it returns `BlockInfo` with current height
- [ ] **AC 6**: Given valid sender/recipient/amount, when `estimateFees()` is called, then it returns `FilecoinFeeEstimation` with value and gas parameters
- [ ] **AC 7**: Given valid transaction input, when `craftTransaction()` is called, then it returns `CraftedTransaction` with CBOR-serialized message
- [ ] **AC 8**: Given a token transfer input, when `craftTransaction()` is called, then it uses `InvokeEVM` method and encodes ERC20 transfer params
- [ ] **AC 9**: Given unsigned tx and signature, when `combine()` is called, then it returns a signed transaction string
- [ ] **AC 10**: Given a valid signed transaction, when `broadcast()` is called, then it returns the transaction hash
- [ ] **AC 11**: Given an address with transactions, when `listOperations()` is called, then it returns operations with correct types (IN/OUT/FEES)
- [ ] **AC 12**: Given a valid transaction intent, when `validateIntent()` is called, then it returns validation result with errors/warnings

#### API Layer

- [ ] **AC 13**: Given a valid config, when `createApi()` is called, then it returns an object implementing `Api<MemoNotSupported>`
- [ ] **AC 14**: Given API instance, when `getSequence()` is called, then it returns the account nonce as `bigint`
- [ ] **AC 15**: Given API instance, when `getStakes()` is called, then it throws "not supported" error
- [ ] **AC 16**: Given API instance, when `getRewards()` is called, then it throws "not supported" error
- [ ] **AC 17**: Given API instance, when `getValidators()` is called, then it throws "not supported" error
- [ ] **AC 18**: Given API instance, when `craftRawTransaction()` is called, then it throws "not supported" error
- [ ] **AC 19**: Given a send transaction intent, when `craftTransaction()` is called on API, then it crafts the transaction with estimated fees

#### Bridge Compatibility

- [ ] **AC 20**: Given existing bridge usage, when `createBridges(signerContext)` is called, then it returns functional CurrencyBridge and AccountBridge
- [ ] **AC 21**: Given bridge instance, when transaction lifecycle is executed (create → prepare → sign → broadcast), then it completes successfully
- [ ] **AC 22**: Given bridge refactoring, when Ledger Live uses the bridge, then no behavioral changes are observed

#### Token Support

- [ ] **AC 23**: Given an address with ERC20 tokens, when `getBalance()` is called with token contracts, then it returns token balances
- [ ] **AC 24**: Given a token transfer intent, when `craftTransaction()` is called, then it creates an InvokeEVM transaction
- [ ] **AC 25**: Given address with token transactions, when `listOperations()` is called, then it includes token transfer operations

## Additional Context

### Dependencies

**External:**
- `@ledgerhq/coin-framework` - Bridge helpers, API interface, serialization
- `iso-filecoin` - Filecoin address/message handling, CBOR
- `bignumber.js` - Big number handling
- `rxjs` - Observable patterns for bridge
- `ethers` - ABI encoding for ERC20 transfers
- `@zondax/cbor` - CBOR encoding for transaction params

**Internal Dependencies:**
- `api/api.ts` (HTTP client) - Keep as network layer
- `network/addresses.ts` - Address validation/conversion
- `erc20/tokenAccounts.ts` - Token utilities

**API Endpoints Used:**
- `GET /v2/addresses/{addr}/balance` - Native balance
- `GET /v2/network/status` - Block height
- `GET /v2/addresses/{addr}/transactions` - Transaction history
- `POST /v2/transactions/send` - Broadcast
- `POST /v2/transactions/estimateFees` - Fee estimation
- `GET /v2/addresses/{addr}/transactions/erc20` - Token transfers
- `GET /v2/contract/{contractAddr}/address/{ethAddr}/balance/erc20` - Token balance

### Testing Strategy

**Unit Tests (logic/):**
- `validateAddress.test.ts` - Address validation with various formats
- `lastBlock.test.ts` - Block height fetching (mock network)
- `getBalance.test.ts` - Balance fetching (native + tokens)
- `estimateFees.test.ts` - Fee estimation with gas parameters
- `craftTransaction.test.ts` - Transaction creation (native + token)
- `combine.test.ts` - Signature combination
- `broadcast.test.ts` - Transaction broadcasting
- `listOperations.test.ts` - Operation listing with pagination
- `validateIntent.test.ts` - Intent validation

**Integration Tests (api/):**
- `index.test.ts` - createApi unit tests
- `index.integ.test.ts` - Full API integration with mocked network (MSW)

**Bridge Tests:**
- Verify existing tests pass
- Add regression tests for logic integration

**Manual Testing:**
- Test in Ledger Live Desktop with real device
- Verify FIL send/receive works
- Verify ERC20 token operations work

### Risk Assessment

**High Risk:**
- Bridge backward compatibility - must not break existing Ledger Live functionality
- Transaction serialization - CBOR format must match Filecoin network expectations

**Medium Risk:**
- Token balance aggregation - parallel fetching may have edge cases
- Fee estimation - gas parameters must be accurate for transactions to succeed

**Low Risk:**
- Address validation - well-tested in existing code
- API interface - follows established patterns from other modules

### Notes

- Reference implementations: coin-algorand, coin-evm, coin-xrp, coin-tron, coin-stellar, coin-tezos (all Alpaca-compliant)
- Current coin-filecoin structure: bridge/, api/ (HTTP client), common-logic/, network/, signer/, types/, erc20/
- Filecoin uses nonce-based transactions (sequence number available)
- Address formats: f1/f3 (secp256k1/BLS), f4 (delegated/Ethereum-compatible)
- Keep `api/api.ts` as the HTTP client layer (rename considerations for clarity)
- The `common-logic/` directory can be deprecated after migration, with code moved to `logic/`

### Reference Patterns from Other Modules

**coin-evm (most relevant for token support):**
- ERC20 ABI encoding with ethers.js in `logic/common.ts`
- Token balance fetching in parallel with native balance
- `getTokenFromAsset` / `getAssetFromToken` utilities for token conversion
- Token operations extraction from explorer API

**coin-xrp (sequence/nonce handling):**
- `getSequence(address)` returns `bigint` from account info
- Pattern: network fetch (number) → API layer conversion (bigint)
- Used in `craftTransaction` for transaction building

**coin-tron (multi-asset balance):**
- `getBalance()` aggregates native + TRC10 + TRC20 balances
- Soft limit pagination pattern for operations
- Separate fetching of native and token transactions

**coin-stellar (memo handling - for reference):**
- Uses `StellarMemo` type with discrimination
- Confirms our approach: Filecoin uses `MemoNotSupported`

**coin-tezos (full API implementation):**
- `getSequence(address)` returns counter+1 for transaction nonce
- Custom `TezosFeeEstimation` with `parameters` (gasLimit, storageLimit)
- `getStakes()` implemented for delegation (Filecoin will throw "not supported")
- Comprehensive test coverage: unit tests + integration tests
- Intent type mapping: `mapIntentTypeToTezosMode()`

### Logic Module Function Mapping

| Logic Function | Source Location | Purpose |
| -------------- | --------------- | ------- |
| `broadcast` | `bridge/broadcast.ts`, `common-logic/utils.ts` | Broadcast signed transaction |
| `combine` | `bridge/signOperation.ts` (signing result) | Combine tx + signature |
| `craftTransaction` | `bridge/serializer.ts`, `bridge/prepareTransaction.ts` | Create unsigned transaction |
| `estimateFees` | `api/api.ts`, `bridge/utils.ts` | Estimate transaction fees |
| `getBalance` | `api/api.ts`, `erc20/tokenAccounts.ts` | Get native + token balances |
| `lastBlock` | `api/api.ts` | Get current block height |
| `listOperations` | `common-logic/utils.ts`, `erc20/tokenAccounts.ts` | List operations with pagination |
| `validateIntent` | `bridge/getTransactionStatus.ts` | Validate transaction intent |
| `validateAddress` | `network/addresses.ts` | Validate Filecoin address |
