# Story 4.7: Validate Transaction Intent

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to validate a transaction intent against account balances,
So that I can warn users about issues before they sign.

## Acceptance Criteria

1. **Given** a valid intent with sufficient balance
   **When** I call `api.validateIntent(intent, balances)`
   **Then** I receive a `TransactionValidation` with no errors

2. **Given** an intent where the sender has insufficient EGLD for transfer + fees
   **When** I call `api.validateIntent(intent, balances)`
   **Then** I receive a validation with an error indicating insufficient balance

3. **Given** an ESDT intent where the sender lacks the specified token
   **When** I call `api.validateIntent(intent, balances)`
   **Then** I receive a validation with an error indicating missing token balance

4. **Given** an intent with optional fees parameter
   **When** I call `api.validateIntent(intent, balances, fees)`
   **Then** validation includes the provided fee amount in balance calculations

## Tasks / Subtasks

- [x] Task 1: Create `validateIntent()` logic function (AC: #1, #2, #3, #4)
  - [x] 1.1: Create `src/logic/validateIntent.ts` file
  - [x] 1.2: Extract native EGLD balance from balances array
  - [x] 1.3: Extract ESDT token balance if intent.asset.type === "esdt"
  - [x] 1.4: Calculate total spent (amount + fees) for native transfers
  - [x] 1.5: Calculate total spent (amount only) for ESDT transfers, fees from native balance
  - [x] 1.6: Validate sufficient native balance for fees (all transaction types)
  - [x] 1.7: Validate sufficient asset balance for transfer amount
  - [x] 1.8: Return `TransactionValidation` with errors and warnings objects
  - [x] 1.9: Handle optional `customFees` parameter (AC: #4)
  - [x] 1.10: Validate sender address format
  - [x] 1.11: Validate recipient address format
  - [x] 1.12: Validate amount > 0 (unless useAllAmount)

- [x] Task 2: Wire validateIntent to API layer (AC: #1, #2, #3, #4)
  - [x] 2.1: Import `validateIntent` function in `src/api/index.ts`
  - [x] 2.2: Replace placeholder `validateIntent` implementation
  - [x] 2.3: Add JSDoc documentation
  - [x] 2.4: Ensure error handling propagates correctly

- [x] Task 3: Update logic/index.ts exports (AC: #1)
  - [x] 3.1: Export `validateIntent` from logic/index.ts

- [x] Task 4: Create unit tests for validateIntent (AC: #1, #2, #3, #4)
  - [x] 4.1: Create `src/logic/validateIntent.test.ts`
  - [x] 4.2: Test: Validates intent with sufficient balance successfully
  - [x] 4.3: Test: Returns TransactionValidation with no errors for valid intent
  - [x] 4.4: Test: Detects insufficient EGLD balance for transfer + fees
  - [x] 4.5: Test: Detects missing ESDT token balance
  - [x] 4.6: Test: Validates fees are included in balance calculations
  - [x] 4.7: Test: Handles optional customFees parameter
  - [x] 4.8: Test: Validates sender address format
  - [x] 4.9: Test: Validates recipient address format
  - [x] 4.10: Test: Validates amount > 0 requirement
  - [x] 4.11: Test: Handles useAllAmount flag correctly
  - [x] 4.12: Test: Returns correct estimatedFees and totalSpent values

- [x] Task 5: Create integration tests for validateIntent (AC: #1, #2, #3, #4)
  - [x] 5.1: Add tests to `src/api/index.integ.test.ts`
  - [x] 5.2: Test: Validates native transfer intent with real balances
  - [x] 5.3: Test: Validates ESDT transfer intent with real balances
  - [x] 5.4: Test: Detects insufficient balance errors correctly
  - [x] 5.5: Test: Validates with custom fees parameter

## Dev Notes

### Epic Context

This story is part of **Epic 4: Transaction Lifecycle** which covers the complete transaction workflow:
- Story 4.1: Craft Native EGLD Transactions (backlog)
- Story 4.2: Craft ESDT Token Transactions (ready-for-dev)
- Story 4.3: Craft Delegation Transactions (backlog)
- Story 4.4: Fee Estimation (ready-for-dev)
- Story 4.5: Combine Transaction with Signature (ready-for-dev)
- Story 4.6: Broadcast Transaction (ready-for-dev)
- **Story 4.7: Validate Transaction Intent** ← Current story
- Story 4.8: Unsupported Raw Transaction Method (backlog)

**FRs Covered:** FR17 - API consumers can validate transaction intents against account balances before signing

**Dependencies:**
- Story 4.4 (fee estimation) provides context for fee structure - `validateIntent` can use `estimateFees` if fees not provided
- Story 1.2 (getBalance) provides the balance data structure that `validateIntent` validates against
- Story 1.3 (ESDT balance query) provides ESDT token balance structure

### Architecture Compliance

**ADR-001 (Data Transformation):** The `validateIntent()` function validates `TransactionIntent` against `Balance[]` data, returning standardized `TransactionValidation` type. It's a pure logic function in `logic/` folder.

**ADR-002 (State Mapping):** Not applicable - this is validation logic, not state mapping.

**ADR-003 (Error Handling):** 
- For invalid addresses: throw `Error` with message `"Invalid sender address"` or `"Invalid recipient address"`
- For insufficient balance: add error to `errors.amount` with descriptive message
- For missing token: add error to `errors.amount` with message `"Token not found in account"` or `"Insufficient token balance"`
- Errors are returned in `TransactionValidation.errors` object, not thrown (per Alpaca API pattern)

**ADR-004 (Token Handling):** 
- Must handle both native EGLD and ESDT token transfers
- For ESDT transfers: check token balance from `balances` array matching `intent.asset.assetReference`
- For native transfers: check native balance (first item in `balances` array)
- Fees always come from native EGLD balance, regardless of asset type

**ADR-005 (Test Structure):** Add integration tests to existing `src/api/index.integ.test.ts` file.

### Technical Requirements

**TransactionValidation Type Structure:**

From `@ledgerhq/coin-framework/api/types`:
```typescript
export type TransactionValidation = {
  errors: Record<string, Error>;
  warnings: Record<string, Error>;
  estimatedFees: bigint;
  totalFees?: bigint;
  amount: bigint;
  totalSpent: bigint;
};
```

**TransactionIntent Type:**

From `@ledgerhq/coin-framework/api/types`:
```typescript
export type TransactionIntent<MemoType extends Memo = Memo, TxDataType extends TxData = TxData> = {
  sender: string;
  recipient: string;
  value: bigint;
  asset: Asset;
  useAllAmount?: boolean;
  type?: string; // "send", "delegate", "unDelegate", etc.
  // ... other fields
};
```

**Balance Type:**

From `@ledgerhq/coin-framework/api/types`:
```typescript
export type Balance = {
  value: bigint;
  asset: Asset;
};
```

**Asset Type:**

```typescript
export type Asset = 
  | { type: "native" }
  | { type: "esdt"; assetReference: string }; // Token identifier like "TOKEN-abc123"
```

**FeeEstimation Type:**

```typescript
export type FeeEstimation = {
  value: bigint;
  parameters?: Record<string, unknown>;
};
```

**Validation Logic:**

1. **Extract balances:**
   - Native balance: `balances.find(b => b.asset.type === "native")?.value ?? 0n`
   - ESDT balance (if token transfer): `balances.find(b => b.asset.type === "esdt" && b.asset.assetReference === intent.asset.assetReference)`

2. **Calculate fees:**
   - If `customFees` provided: use `customFees.value`
   - Otherwise: use `0n` (caller should call `estimateFees` first if needed)

3. **Calculate total spent:**
   - Native transfer: `totalSpent = intent.value + fees`
   - ESDT transfer: `totalSpent = intent.value` (fees paid separately from native balance)

4. **Validate balances:**
   - Native transfer: Check `totalSpent <= nativeBalance`
   - ESDT transfer: 
     - Check `intent.value <= esdtBalance.value`
     - Check `fees <= nativeBalance` (fees come from native balance)

5. **Address validation:**
   - Use `isValidAddress()` from `src/logic` (same as used in `getBalance`)

**Reference Implementation:**

From `libs/coin-modules/coin-multiversx/src/getTransactionStatus.ts` (bridge implementation):
- Lines 30-149 show comprehensive validation logic
- Checks recipient, fees, amount, balance
- Handles token accounts vs native accounts
- Returns errors and warnings objects

**Key Differences from Bridge:**
- Bridge uses `MultiversXAccount` and `Transaction` types
- API uses `TransactionIntent` and `Balance[]` types
- Bridge has more complex delegation validation (not needed for API)
- API validation is simpler - just balance checks

**Reference from Other Coin Modules:**

- `coin-algorand/src/logic/validateIntent.ts` - Shows pattern for native + token balance validation
- `coin-filecoin/src/logic/validateIntent.ts` - Shows simple balance validation pattern
- `coin-evm/src/logic/validateIntent.ts` - Shows comprehensive validation with multiple checks

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- `isValidAddress()` from `src/logic` for address validation
- TypeScript types from `@ledgerhq/coin-framework/api/types`
- Native `bigint` arithmetic for balance calculations

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/validateIntent.ts` | Logic function to validate transaction intent against balances |
| `libs/coin-modules/coin-multiversx/src/logic/validateIntent.test.ts` | Unit tests for validateIntent function |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export `validateIntent` function |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Wire `validateIntent` to API layer (replace placeholder) |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add integration tests |

### Existing Code to Leverage

**`getTransactionStatus.ts` - Bridge validation logic (lines 30-149):**

```typescript
export const getTransactionStatus: AccountBridge<...>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  
  // Address validation
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress(...);
  }
  
  // Fee validation
  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }
  
  // Balance validation
  let totalSpentEgld = new BigNumber(0);
  if (tokenAccount) {
    // Token transfer logic
    totalSpentEgld = transaction.fees || new BigNumber(0);
    if (transaction.amount.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    // Native transfer logic
    totalSpentEgld = transaction.fees?.plus(transaction.amount) || transaction.amount;
  }
  
  if (totalSpentEgld.gt(account.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }
  
  return { errors, warnings, estimatedFees, amount, totalSpent };
};
```

**Key Adaptations for API:**
- Replace `account.spendableBalance` with `balances.find(b => b.asset.type === "native")?.value`
- Replace `tokenAccount.balance` with ESDT balance from `balances` array
- Replace `BigNumber` with native `bigint`
- Simplify delegation validation (not needed for basic API validation)

**`isValidAddress()` from `src/logic`:**

Already used in `getBalance.ts` - reuse for address validation.

**Reference implementations from other coin modules:**
- `coin-algorand/src/logic/validateIntent.ts` - Shows native + token balance pattern
- `coin-filecoin/src/logic/validateIntent.ts` - Shows simple validation pattern
- `coin-evm/src/logic/validateIntent.ts` - Shows comprehensive validation

### Import Pattern

Follow existing pattern from other logic files:

```typescript
// Types
import type {
  TransactionIntent,
  TransactionValidation,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
} from "@ledgerhq/coin-framework/api/types";

// Logic utilities
import { isValidAddress } from "../logic";
```

### Implementation Pattern

```typescript
/**
 * Validates a transaction intent against account balances.
 * 
 * @param intent - The transaction intent to validate
 * @param balances - Current account balances (from getBalance)
 * @param customFees - Optional fee estimation (from estimateFees)
 * @returns TransactionValidation with errors, warnings, and calculated amounts
 */
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  
  // Validate sender address
  if (!intent.sender || !isValidAddress(intent.sender)) {
    errors.sender = new Error("Invalid sender address");
  }
  
  // Validate recipient address
  if (!intent.recipient || !isValidAddress(intent.recipient)) {
    errors.recipient = new Error("Invalid recipient address");
  }
  
  // Validate amount
  if (intent.value <= 0n && !intent.useAllAmount) {
    errors.amount = new Error("Amount must be greater than 0");
  }
  
  // Extract balances
  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;
  const fees = customFees?.value ?? 0n;
  
  // Calculate amount (handle useAllAmount if needed)
  let amount = intent.value;
  if (intent.useAllAmount) {
    if (intent.asset.type === "native") {
      const spendable = nativeBalance - fees;
      amount = spendable > 0n ? spendable : 0n;
    } else {
      // For ESDT, use token balance
      const tokenBalance = balances.find(
        b => b.asset.type === "esdt" && 
        (b.asset as { assetReference?: string }).assetReference === 
        (intent.asset as { assetReference?: string }).assetReference
      );
      amount = tokenBalance?.value ?? 0n;
    }
  }
  
  // Validate based on asset type
  if (intent.asset.type === "native") {
    // Native EGLD transfer
    const totalSpent = amount + fees;
    
    if (!errors.amount && totalSpent > nativeBalance) {
      errors.amount = new Error("Insufficient balance");
    }
    
    return {
      errors,
      warnings,
      estimatedFees: fees,
      amount,
      totalSpent,
    };
  } else {
    // ESDT token transfer
    const tokenBalance = balances.find(
      b => b.asset.type === "esdt" && 
      (b.asset as { assetReference?: string }).assetReference === 
      (intent.asset as { assetReference?: string }).assetReference
    );
    
    if (!tokenBalance) {
      errors.amount = new Error("Token not found in account");
    } else if (!errors.amount && amount > tokenBalance.value) {
      errors.amount = new Error("Insufficient token balance");
    }
    
    // Fees come from native balance
    if (fees > nativeBalance) {
      errors.amount = new Error("Insufficient balance for fees");
    }
    
    const totalSpent = amount; // Fees paid separately
    
    return {
      errors,
      warnings,
      estimatedFees: fees,
      amount,
      totalSpent,
    };
  }
}
```

**Note:** The function is async to match the API interface, even though it doesn't need to be async for this implementation. This allows future enhancements (e.g., network validation) without changing the signature.

### Testing Requirements

**Unit Tests (`src/logic/validateIntent.test.ts`):**

```typescript
import { validateIntent } from "./validateIntent";
import type {
  TransactionIntent,
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TxDataNotSupported,
} from "@ledgerhq/coin-framework/api/types";

describe("validateIntent", () => {
  const VALID_SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALID_RECIPIENT = "erd1spyavw0956vq68rj8tv4fs5k4x38fsx4vq4hx0tvxmvx0x2qy8sp3len7";
  
  const NATIVE_BALANCE: Balance = {
    value: 1000000000000000000n, // 1 EGLD
    asset: { type: "native" },
  };
  
  const ESDT_BALANCE: Balance = {
    value: 5000000000000000000n, // 5 tokens
    asset: { type: "esdt", assetReference: "TOKEN-abc123" },
  };
  
  it("validates intent with sufficient balance successfully", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 500000000000000000n, // 0.5 EGLD
      asset: { type: "native" },
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n, // 0.00005 EGLD
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(500000000000000000n);
    expect(result.totalSpent).toBe(550000000000000000n);
  });
  
  it("detects insufficient EGLD balance for transfer + fees", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 1000000000000000000n, // 1 EGLD (exceeds balance)
      asset: { type: "native" },
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n,
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient balance");
  });
  
  it("detects missing ESDT token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 1000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-xyz789" }, // Different token
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n,
    };
    
    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Token not found");
  });
  
  it("validates fees are included in balance calculations", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 950000000000000000n, // 0.95 EGLD
      asset: { type: "native" },
    };
    
    const fees: FeeEstimation = {
      value: 100000000000000000n, // 0.1 EGLD (total would be 1.05 EGLD, exceeds balance)
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.totalSpent).toBe(1050000000000000000n); // amount + fees
  });
  
  it("handles optional customFees parameter", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 500000000000000000n,
      asset: { type: "native" },
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    // Without customFees, fees should be 0n
    const result1 = await validateIntent(intent, balances);
    expect(result1.estimatedFees).toBe(0n);
    
    // With customFees, fees should be used
    const fees: FeeEstimation = { value: 50000000000000n };
    const result2 = await validateIntent(intent, balances, fees);
    expect(result2.estimatedFees).toBe(50000000000000n);
  });
  
  it("validates sender address format", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: "invalid-address",
      recipient: VALID_RECIPIENT,
      value: 100000000000000000n,
      asset: { type: "native" },
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances);
    
    expect(result.errors.sender).toBeDefined();
    expect(result.errors.sender?.message).toContain("Invalid sender address");
  });
  
  it("validates recipient address format", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: "invalid-address",
      value: 100000000000000000n,
      asset: { type: "native" },
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances);
    
    expect(result.errors.recipient).toBeDefined();
    expect(result.errors.recipient?.message).toContain("Invalid recipient address");
  });
  
  it("validates amount > 0 requirement", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 0n,
      asset: { type: "native" },
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Amount must be greater than 0");
  });
  
  it("handles useAllAmount flag correctly", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 0n, // Will be calculated from balance
      asset: { type: "native" },
      useAllAmount: true,
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n,
    };
    
    const balances: Balance[] = [NATIVE_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    // Amount should be calculated: balance - fees = 1 EGLD - 0.00005 EGLD
    expect(result.amount).toBe(999950000000000000n);
    expect(result.totalSpent).toBe(1000000000000000000n); // amount + fees = balance
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
  
  it("validates ESDT transfer with sufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 2000000000000000000n, // 2 tokens
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n,
    };
    
    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(Object.keys(result.errors)).toHaveLength(0);
    expect(result.amount).toBe(2000000000000000000n);
    expect(result.totalSpent).toBe(2000000000000000000n); // Only token amount, fees separate
  });
  
  it("validates ESDT transfer with insufficient token balance", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 10000000000000000000n, // 10 tokens (exceeds balance)
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };
    
    const fees: FeeEstimation = {
      value: 50000000000000n,
    };
    
    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient token balance");
  });
  
  it("validates ESDT transfer with insufficient native balance for fees", async () => {
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: VALID_SENDER,
      recipient: VALID_RECIPIENT,
      value: 2000000000000000000n,
      asset: { type: "esdt", assetReference: "TOKEN-abc123" },
    };
    
    const fees: FeeEstimation = {
      value: 2000000000000000000n, // 2 EGLD (exceeds native balance)
    };
    
    const balances: Balance[] = [NATIVE_BALANCE, ESDT_BALANCE];
    
    const result = await validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient balance for fees");
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("validateIntent", () => {
  it("validates native transfer intent with real balances", async () => {
    const api = createApi();
    
    // Get real balances from test account
    const balances = await api.getBalance(TEST_ADDRESS);
    
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: TEST_ADDRESS,
      recipient: TEST_ADDRESS_2,
      value: 100000000000000000n, // 0.1 EGLD
      asset: { type: "native" },
    };
    
    // Estimate fees first
    const fees = await api.estimateFees(intent);
    
    const result = await api.validateIntent(intent, balances, fees);
    
    expect(result).toBeDefined();
    expect(result.estimatedFees).toBeGreaterThan(0n);
    expect(result.amount).toBe(100000000000000000n);
    expect(result.totalSpent).toBeGreaterThan(100000000000000000n); // amount + fees
  });
  
  it("validates ESDT transfer intent with real balances", async () => {
    const api = createApi();
    
    const balances = await api.getBalance(TEST_ADDRESS);
    
    // Find an ESDT token balance
    const esdtBalance = balances.find(b => b.asset.type === "esdt");
    if (!esdtBalance) {
      // Skip if account has no ESDT tokens
      return;
    }
    
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: TEST_ADDRESS,
      recipient: TEST_ADDRESS_2,
      value: 100000000000000000n,
      asset: {
        type: "esdt",
        assetReference: (esdtBalance.asset as { assetReference?: string }).assetReference!,
      },
    };
    
    const fees = await api.estimateFees(intent);
    const result = await api.validateIntent(intent, balances, fees);
    
    expect(result).toBeDefined();
    expect(result.amount).toBe(100000000000000000n);
  });
  
  it("detects insufficient balance errors correctly", async () => {
    const api = createApi();
    
    const balances = await api.getBalance(TEST_ADDRESS);
    const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? 0n;
    
    // Create intent that exceeds balance
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: TEST_ADDRESS,
      recipient: TEST_ADDRESS_2,
      value: nativeBalance + 1000000000000000000n, // Exceeds balance
      asset: { type: "native" },
    };
    
    const fees = await api.estimateFees(intent);
    const result = await api.validateIntent(intent, balances, fees);
    
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.amount?.message).toContain("Insufficient");
  });
  
  it("validates with custom fees parameter", async () => {
    const api = createApi();
    
    const balances = await api.getBalance(TEST_ADDRESS);
    
    const intent: TransactionIntent<MemoNotSupported, TxDataNotSupported> = {
      sender: TEST_ADDRESS,
      recipient: TEST_ADDRESS_2,
      value: 100000000000000000n,
      asset: { type: "native" },
    };
    
    const customFees: FeeEstimation = {
      value: 100000000000000000n, // 0.1 EGLD
    };
    
    const result = await api.validateIntent(intent, balances, customFees);
    
    expect(result.estimatedFees).toBe(100000000000000000n);
    expect(result.totalSpent).toBe(200000000000000000n); // amount + fees
  });
});
```

**Important Testing Notes:**
- Unit tests should cover all validation scenarios
- Integration tests use real balances from `getBalance()` for realistic testing
- Test both native and ESDT transfers
- Test error cases (insufficient balance, missing token, invalid addresses)
- Test edge cases (useAllAmount, zero amount, zero fees)

### Project Structure Notes

**Alignment with Unified Project Structure:**
- New `logic/validateIntent.ts` follows established pattern from other logic functions (`getBalance.ts`, `getSequence.ts`)
- Unit tests co-located in same folder (`validateIntent.test.ts`)
- Integration tests in single `index.integ.test.ts` file (ADR-005)
- Pure function pattern - no side effects, no network calls (uses provided balances)

**Validation Logic Consistency:**
- Input format matches `getBalance()` output format (`Balance[]`)
- Output format matches Alpaca API interface (`TransactionValidation`)
- Error handling follows ADR-003 pattern (errors in return object, not thrown)
- Address validation reuses `isValidAddress()` from existing logic

### Previous Story Intelligence

**From Epic 1 (getBalance, getSequence):**
- Established pattern for logic functions: validate input → transform → return
- Error message format: `"Invalid {type}: {reason}"`
- Balance structure: `Balance[]` with native balance first, then ESDT tokens
- Address validation using `isValidAddress()` helper

**From Epic 2 (listOperations):**
- JSON parsing pattern with try-catch for error handling
- Type safety with TypeScript interfaces

**From Epic 3 (getStakes, getValidators):**
- Network call patterns via `apiClient`
- Error handling for network failures

**From Story 4.4 (estimateFees):**
- Fee structure: `FeeEstimation` with `value` (bigint) and optional `parameters`
- Gas limit and gas price structure
- Fee calculation: `gasLimit * gasPrice`

**From Story 4.5 (combine):**
- Transaction structure understanding
- JSON string handling patterns

**From Story 4.6 (broadcast):**
- Transaction format understanding
- Error handling patterns

**Key Learnings:**
1. Always validate input format before processing
2. Use descriptive error messages following ADR-003
3. Pure functions are easier to test and reason about
4. Match input format to previous function's output (`getBalance()` → `validateIntent()`)
5. Errors are returned in validation object, not thrown (per Alpaca API pattern)
6. Balance array structure: native first, then ESDT tokens
7. Fees always come from native balance, regardless of asset type

### Git Intelligence Summary

**Recent Commits Analysis:**
- Other coin modules (Algorand, Filecoin, EVM) provide reference implementations for `validateIntent`
- Common pattern: Extract balances → Calculate total spent → Validate → Return errors/warnings
- Error handling: Errors in return object, not thrown
- Balance validation: Check both native and token balances separately

**Code Patterns Established:**
- Pure logic functions in `logic/` folder
- Unit tests co-located with source files
- Integration tests in `api/index.integ.test.ts`
- JSDoc comments for public API methods
- Error messages follow ADR-003 format
- Address validation using `isValidAddress()` helper

### Latest Tech Information

**MultiversX Transaction Validation:**
- MultiversX transactions require sufficient native EGLD balance for fees
- ESDT token transfers require both token balance (for transfer) and native balance (for fees)
- Address format: `erd1...` (bech32 encoded)
- Minimum transaction amount: No minimum for native transfers (but fees apply)
- Minimum delegation amount: 1 EGLD (but this is handled in `craftTransaction`, not `validateIntent`)

**Balance Validation Best Practices:**
- Always check native balance for fees, even for token transfers
- Token balance checks should match by `assetReference` (token identifier)
- Use `bigint` for all amount calculations to avoid precision issues
- Return errors in validation object rather than throwing (allows multiple errors)

**Validation Flow:**
1. Validate addresses (sender, recipient)
2. Validate amount > 0 (unless useAllAmount)
3. Extract balances (native, token if applicable)
4. Calculate fees (from customFees or 0n)
5. Calculate total spent (amount + fees for native, amount only for tokens)
6. Validate balances (native for fees, asset for transfer)
7. Return validation result with errors, warnings, and amounts

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.7] - Original story definition and acceptance criteria
- [Source: _bmad-output/implementation-artifacts/4-4-fee-estimation.md] - Fee estimation story for fee structure context
- [Source: _bmad-output/implementation-artifacts/4-6-broadcast-transaction.md] - Broadcast story for transaction format context
- [Source: libs/coin-modules/coin-multiversx/src/getTransactionStatus.ts] - Bridge validation logic reference
- [Source: libs/coin-modules/coin-multiversx/src/logic/getBalance.ts] - Balance structure reference
- [Source: libs/coin-framework/src/api/types.ts#TransactionValidation] - TransactionValidation type definition
- [Source: libs/coin-modules/coin-algorand/src/logic/validateIntent.ts] - Reference implementation pattern
- [Source: libs/coin-modules/coin-filecoin/src/logic/validateIntent.ts] - Reference implementation pattern
- [Source: libs/coin-modules/coin-evm/src/logic/validateIntent.ts] - Reference implementation pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-001] - Data transformation patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-003] - Error handling patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-004] - Token handling patterns

## Change Log

**2026-02-03: Code Review Fixes Applied**
- **CRITICAL FIX**: Fixed error overwriting bug in ESDT validation - fees error now uses separate `errors.fees` key instead of overwriting `errors.amount`
- **HIGH FIX**: Added validation for empty balances array - returns error if balances array is empty
- **HIGH FIX**: Added validation for multiple native balances - detects and reports invalid state with multiple native balances
- **MEDIUM FIX**: Added type guard function `isEsdtAsset()` for safer type checking instead of type assertions
- **MEDIUM FIX**: Optimized balance lookups by caching native balance extraction and using type guards
- **MEDIUM FIX**: Added defensive validation for negative balance values
- **TEST FIX**: Added 6 new test cases covering edge cases:
  - Empty balances array validation
  - Missing native balance validation
  - Multiple native balances detection
  - useAllAmount when balance equals fees exactly
  - useAllAmount when fees exceed balance
  - Both insufficient token balance AND insufficient fees (both errors preserved)
- Updated integration test expectations to use `errors.fees` instead of `errors.amount` for fee-related errors

**2026-02-03: Story 4.7 Implementation Complete**
- Implemented `validateIntent()` logic function with full validation logic
- Added comprehensive unit tests (18 test cases, up from 12)
- Added integration tests (4 test cases) using real MultiversX mainnet
- Wired function to API layer with proper JSDoc documentation
- All acceptance criteria satisfied:
  - AC #1: Validates intent with sufficient balance successfully ✓
  - AC #2: Detects insufficient EGLD balance for transfer + fees ✓
  - AC #3: Detects missing ESDT token balance ✓
  - AC #4: Handles optional fees parameter ✓

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Implementation Summary:**
- Created `validateIntent()` logic function that validates transaction intents against account balances
- Function handles both native EGLD and ESDT token transfers
- Validates sender/recipient addresses, amounts, and balance sufficiency
- Supports optional `customFees` parameter and `useAllAmount` flag
- Returns `TransactionValidation` with errors, warnings, and calculated amounts
- All unit tests and integration tests implemented and passing
- Function follows ADR patterns: pure logic function, errors in return object (not thrown), proper address validation

**Key Features:**
- Address validation using `isValidAddress()` helper
- Native balance extraction and validation
- ESDT token balance matching by `assetReference`
- Fee calculation from `customFees` or default to 0n
- `useAllAmount` handling for both native and ESDT transfers
- Comprehensive error messages per ADR-003
- Total spent calculation: amount + fees for native, amount only for ESDT (fees separate)

**Test Coverage:**
- 12 unit tests covering all validation scenarios
- 4 integration tests using real MultiversX mainnet balances
- Tests cover: valid intents, insufficient balances, missing tokens, address validation, useAllAmount, custom fees

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/validateIntent.ts` - Logic function to validate transaction intent against balances
- `libs/coin-modules/coin-multiversx/src/logic/validateIntent.test.ts` - Unit tests for validateIntent function

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added export for validateIntent
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Wired validateIntent to API layer, replaced placeholder implementation
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for validateIntent
