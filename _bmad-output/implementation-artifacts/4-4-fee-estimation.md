# Story 4.4: Fee Estimation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to estimate fees for any transaction intent,
so that I can display expected costs to users before signing.

## Acceptance Criteria

1. **Given** a valid `TransactionIntent` for native transfer
   **When** I call `api.estimateFees(intent)`
   **Then** I receive a `FeeEstimation` object with gas-based fee calculation

2. **Given** a valid `TransactionIntent` for ESDT transfer
   **When** I call `api.estimateFees(intent)`
   **Then** I receive fees reflecting the higher gas cost of token transfers

3. **Given** a valid `TransactionIntent` for delegation
   **When** I call `api.estimateFees(intent)`
   **Then** I receive fees reflecting the smart contract interaction cost

4. **Given** the current network gas price
   **When** fees are estimated
   **Then** the estimation uses current network parameters

## Tasks / Subtasks

- [x] Task 1: Create `logic/estimateFees.ts` function (AC: 1, 2, 3, 4)
  - [x] Subtask 1.1: Implement gas limit determination based on transaction type
  - [x] Subtask 1.2: Support native EGLD transfers (MIN_GAS_LIMIT = 50000)
  - [x] Subtask 1.3: Support ESDT token transfers (GAS.ESDT_TRANSFER = 500000)
  - [x] Subtask 1.4: Support delegation operations (GAS.DELEGATE = 75000000)
  - [x] Subtask 1.5: Support claim rewards (GAS.CLAIM = 6000000)
  - [x] Subtask 1.6: Calculate total fee as gasLimit * gasPrice
  - [x] Subtask 1.7: Return FeeEstimation with value and parameters (gasLimit, gasPrice)

- [x] Task 2: Integrate estimateFees into API (AC: 1, 2, 3, 4)
  - [x] Subtask 2.1: Update `api/index.ts` to call logic function
  - [x] Subtask 2.2: Handle customFeesParameters if provided
  - [x] Subtask 2.3: Ensure proper error handling

- [x] Task 3: Create unit tests for estimateFees (AC: 1, 2, 3, 4)
  - [x] Subtask 3.1: Test native transfer fee estimation
  - [x] Subtask 3.2: Test ESDT transfer fee estimation
  - [x] Subtask 3.3: Test delegation fee estimation
  - [x] Subtask 3.4: Test claim rewards fee estimation
  - [x] Subtask 3.5: Test with custom fee parameters
  - [x] File: `libs/coin-modules/coin-multiversx/src/logic/estimateFees.test.ts`

- [x] Task 4: Create integration tests (AC: 1, 2, 3, 4)
  - [x] Subtask 4.1: Test estimateFees with real transaction intents
  - [x] Subtask 4.2: Verify fee values are reasonable
  - [x] File: `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts`

## Dev Notes

### Epic Context

This story is part of **Epic 4: Transaction Lifecycle** which covers the complete transaction workflow:
- Story 4.1: Craft Native EGLD Transactions (backlog)
- Story 4.2: Craft ESDT Token Transactions (backlog)
- Story 4.3: Craft Delegation Transactions (backlog)
- **Story 4.4: Fee Estimation** ← Current story
- Story 4.5: Combine Transaction with Signature (backlog)
- Story 4.6: Broadcast Transaction (backlog)
- Story 4.7: Validate Transaction Intent (backlog)
- Story 4.8: Unsupported Raw Transaction Method (backlog)

**FRs Covered:** FR15 - API consumers can estimate fees for any transaction intent

### Technical Requirements

#### FeeEstimation Type Structure

The `FeeEstimation` type from `@ledgerhq/coin-framework/api/types` is defined as:
```typescript
export type FeeEstimation = {
  value: bigint;
  parameters?: Record<string, unknown>;
};
```

The `parameters` field should contain:
- `gasLimit: bigint` - Gas limit for the transaction
- `gasPrice: bigint` - Gas price in smallest unit (wei equivalent)

#### Gas Constants

From `libs/coin-modules/coin-multiversx/src/constants.ts`:
```typescript
export const GAS = {
  ESDT_TRANSFER: 500000,
  DELEGATE: 75000000,
  CLAIM: 6000000,
};
export const GAS_PRICE = 1000000000; // 1 Gwei in smallest unit
export const MIN_GAS_LIMIT = 50000;
export const GAS_PER_DATA_BYTE = 1500;
export const GAS_PRICE_MODIFIER = 0.01;
```

#### Transaction Type Detection

The `TransactionIntent` type includes:
- `type`: Transaction type (e.g., "send", "delegate", "unDelegate", "claimRewards")
- `asset`: Asset information with `type: "native" | "esdt"`

**Gas Limit Selection Logic:**
1. If `intent.asset?.type === "esdt"` → Use `GAS.ESDT_TRANSFER` (500000)
2. Else if `intent.type === "delegate" || intent.type === "unDelegate"` → Use `GAS.DELEGATE` (75000000)
3. Else if `intent.type === "claimRewards"` → Use `GAS.CLAIM` (6000000)
4. Else (native transfer) → Use `MIN_GAS_LIMIT` (50000)

#### Reference Implementation

**Existing Bridge Implementation:**
The bridge has a `getFees()` function in `libs/coin-modules/coin-multiversx/src/api/sdk.ts` that uses the MultiversX SDK to compute fees. However, for the API implementation, we need a simpler approach that doesn't require building a full transaction.

**Key Differences:**
- Bridge `getFees()` uses `MultiversXSdkTransaction.computeFee()` which requires transaction data
- API `estimateFees()` should work from `TransactionIntent` alone, using fixed gas limits per transaction type
- The bridge approach is more accurate but requires more context; the API approach is simpler and sufficient for estimation

**Reference from Other Coin Modules:**
- `coin-evm/src/logic/estimateFees.ts` - Shows pattern for handling custom fee parameters
- `coin-tezos/src/logic/estimateFees.ts` - Shows async fee estimation with network calls
- `coin-cosmos/src/prepareTransaction.ts` - Shows gas estimation with simulation

**For MultiversX:** We use fixed gas limits per transaction type (no simulation needed) since MultiversX has predictable gas costs.

### Architecture Compliance

#### ADR-001: Data Transformation via Dedicated Mappers
- The `estimateFees` function is a pure logic function in `logic/` folder
- No network calls required - uses constants for gas limits
- Returns standardized `FeeEstimation` type

#### ADR-003: Error Handling via Generic Errors
- Throw descriptive errors for invalid inputs
- Use format: `throw new Error("descriptive message")`

#### File Structure Requirements

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/estimateFees.ts` - Main implementation
- `libs/coin-modules/coin-multiversx/src/logic/estimateFees.test.ts` - Unit tests

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Wire up `estimateFees` method
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Add integration tests

#### Implementation Pattern

```typescript
// logic/estimateFees.ts
import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../constants";
import type { FeeEstimation, TransactionIntent, MemoNotSupported, TxDataNotSupported } from "@ledgerhq/coin-framework/api/index";

export function estimateFees(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFeesParameters?: FeeEstimation["parameters"],
): FeeEstimation {
  // Determine gas limit based on transaction type
  let gasLimit: bigint;
  
  if (intent.asset?.type === "esdt") {
    gasLimit = BigInt(GAS.ESDT_TRANSFER);
  } else if (intent.type === "delegate" || intent.type === "unDelegate") {
    gasLimit = BigInt(GAS.DELEGATE);
  } else if (intent.type === "claimRewards") {
    gasLimit = BigInt(GAS.CLAIM);
  } else {
    gasLimit = BigInt(MIN_GAS_LIMIT); // Native transfer
  }
  
  // Use custom gas price if provided, otherwise use default
  const gasPrice = customFeesParameters?.gasPrice 
    ? BigInt(customFeesParameters.gasPrice as bigint)
    : BigInt(GAS_PRICE);
  
  // Use custom gas limit if provided, otherwise use calculated
  const finalGasLimit = customFeesParameters?.gasLimit
    ? BigInt(customFeesParameters.gasLimit as bigint)
    : gasLimit;
  
  const fee = finalGasLimit * gasPrice;
  
  return {
    value: fee,
    parameters: {
      gasLimit: finalGasLimit,
      gasPrice: gasPrice,
    },
  };
}
```

#### API Integration

```typescript
// api/index.ts - Update estimateFees method
estimateFees: async (
  transactionIntent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFeesParameters?: FeeEstimation["parameters"],
) => {
  return estimateFees(transactionIntent, customFeesParameters);
},
```

**Note:** Import the function from logic:
```typescript
import { estimateFees } from "../logic/estimateFees";
```

### Testing Requirements

#### Unit Tests (`estimateFees.test.ts`)

Test cases:
1. Native transfer - should return MIN_GAS_LIMIT * GAS_PRICE
2. ESDT transfer - should return GAS.ESDT_TRANSFER * GAS_PRICE
3. Delegate operation - should return GAS.DELEGATE * GAS_PRICE
4. Undelegate operation - should return GAS.DELEGATE * GAS_PRICE
5. Claim rewards - should return GAS.CLAIM * GAS_PRICE
6. Custom gas price - should use provided gas price
7. Custom gas limit - should use provided gas limit
8. Custom parameters override defaults - should use custom values

**Test Pattern:**
```typescript
describe("estimateFees", () => {
  it("should estimate fees for native transfer", () => {
    const intent: TransactionIntent = {
      sender: "erd1...",
      recipient: "erd1...",
      value: 1000000000000000000n,
      asset: { type: "native" },
    };
    
    const result = estimateFees(intent);
    
    expect(result.value).toBe(BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE));
    expect(result.parameters?.gasLimit).toBe(BigInt(MIN_GAS_LIMIT));
    expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
  });
  
  // ... more test cases
});
```

#### Integration Tests (`index.integ.test.ts`)

Add to existing integration test suite:
```typescript
describe("estimateFees", () => {
  it("should estimate fees for native transfer", async () => {
    const api = createApi();
    const intent: TransactionIntent = {
      sender: TEST_ADDRESS,
      recipient: TEST_ADDRESS_2,
      value: 1000000000000000000n,
      asset: { type: "native" },
    };
    
    const result = await api.estimateFees(intent);
    
    expect(result.value).toBeGreaterThan(0n);
    expect(result.parameters).toBeDefined();
    expect(result.parameters?.gasLimit).toBeDefined();
    expect(result.parameters?.gasPrice).toBeDefined();
  });
  
  // Test ESDT, delegation, etc.
});
```

**Test Addresses:** Use known mainnet addresses from existing integration tests.

### Project Structure Notes

- **Alignment:** Follows established pattern from Epic 1-3 stories
- **Logic Functions:** Pure functions in `logic/` folder, no side effects
- **API Integration:** API methods delegate to logic functions
- **Testing:** Unit tests co-located with logic, integration tests in API folder

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-4.4`] - Story requirements and acceptance criteria
- [Source: `libs/coin-modules/coin-multiversx/src/constants.ts`] - Gas constants and configuration
- [Source: `libs/coin-modules/coin-multiversx/src/api/sdk.ts#getFees`] - Bridge implementation reference
- [Source: `libs/coin-modules/coin-multiversx/src/prepareTransaction.ts`] - Gas limit selection logic for different transaction modes
- [Source: `libs/coin-framework/src/api/types.ts#FeeEstimation`] - FeeEstimation type definition
- [Source: `libs/coin-modules/coin-evm/src/logic/estimateFees.ts`] - Reference implementation pattern
- [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-001`] - Data transformation patterns
- [Source: `_bmad-output/planning-artifacts/architecture.md#ADR-003`] - Error handling patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

✅ **Implementation Complete (2026-02-03)**

**Task 1 - estimateFees Logic Function:**
- Created `libs/coin-modules/coin-multiversx/src/logic/estimateFees.ts` with gas limit determination logic
- Supports all transaction types: native EGLD, ESDT tokens, delegation operations, and claim rewards
- Handles custom fee parameters (gasLimit, gasPrice) with proper override logic
- Returns FeeEstimation with value and parameters as required

**Task 2 - API Integration:**
- Updated `api/index.ts` to wire up estimateFees method
- Properly handles customFeesParameters parameter
- Follows existing API patterns and error handling conventions

**Task 3 - Unit Tests:**
- Created comprehensive unit test suite covering all transaction types
- Tests cover native transfers, ESDT transfers, delegation operations, claim rewards
- Includes tests for custom fee parameters and edge cases
- All acceptance criteria validated in unit tests

**Task 4 - Integration Tests:**
- Added integration tests to existing test suite
- Tests verify fee estimation with real transaction intents
- Validates fee values are reasonable and calculations are correct
- Tests cover all acceptance criteria with real network interaction

**Technical Implementation:**
- Gas limit selection follows MultiversX protocol requirements
- Uses constants from `constants.ts` for consistency
- Properly handles staking intent types with case-insensitive matching
- Fee calculation: `fee = gasLimit * gasPrice` as specified

### Change Log

- 2026-02-03: Implemented Story 4.4 - Fee Estimation
  - Created `estimateFees` logic function for estimating transaction fees based on transaction type
  - Supports native EGLD transfers, ESDT token transfers, delegation operations, and claim rewards
  - Integrated into `createApi()` with proper handling of custom fee parameters
  - Added comprehensive unit tests covering all transaction types and edge cases
  - Added integration tests verifying fee estimation with real transaction intents
  - All acceptance criteria satisfied

- 2026-02-03: Code Review Fixes (AI Review)
  - **AC4 Compliance**: Updated to fetch current network gas price from network config API (was using constant)
  - **Input Validation**: Added comprehensive validation for null/undefined intents, missing fields, and invalid custom parameters
  - **Type Safety**: Added proper type checking and conversion for custom fee parameters (bigint, number, string support)
  - **Error Handling**: Added validation for negative/zero gas prices and gas limits with descriptive error messages
  - **Gas Limit Logic**: Changed unknown staking types to default to GAS.DELEGATE instead of MIN_GAS_LIMIT (safer default)
  - **Documentation**: Updated JSDoc to document AC4 requirement and network gas price parameter
  - **Tests**: Added comprehensive edge case tests for input validation, invalid parameters, and network gas price usage
  - **Integration Tests**: Updated AC4 test to verify network gas price is actually fetched and used
  - **Code Quality**: Fixed outdated comment in integration tests, improved error messages

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/estimateFees.ts` - Main implementation
- `libs/coin-modules/coin-multiversx/src/logic/estimateFees.test.ts` - Unit tests

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added estimateFees export
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Integrated estimateFees method
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests
