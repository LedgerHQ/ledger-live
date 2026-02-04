# Story 4.6: Broadcast Transaction

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to broadcast a signed transaction to the MultiversX network,
So that I can submit transactions on behalf of users.

## Acceptance Criteria

1. **Given** a valid signed transaction
   **When** I call `api.broadcast(signedTx)`
   **Then** I receive the transaction hash upon successful submission

2. **Given** a transaction that the network rejects
   **When** I call `api.broadcast(signedTx)`
   **Then** an error is thrown with the rejection reason

3. **Given** a network timeout or connectivity issue
   **When** I call `api.broadcast(signedTx)`
   **Then** an error is thrown with a descriptive message (NFR10 compliance)

## Tasks / Subtasks

- [x] Task 1: Create `broadcast()` logic function (AC: #1, #2, #3)
  - [x] 1.1: Create `src/logic/broadcast.ts` file
  - [x] 1.2: Parse signed transaction JSON string from `combine()`
  - [x] 1.3: Convert parsed transaction to `SignedOperation` format expected by network layer
  - [x] 1.4: Call network layer `apiClient.submit()` method
  - [x] 1.5: Return transaction hash as string
  - [x] 1.6: Handle malformed JSON gracefully (AC: #2)
  - [x] 1.7: Handle network errors with descriptive messages (AC: #2, #3)

- [x] Task 2: Wire broadcast to API layer (AC: #1, #2, #3)
  - [x] 2.1: Import `broadcast` function in `src/api/index.ts`
  - [x] 2.2: Replace placeholder `broadcast` implementation
  - [x] 2.3: Add JSDoc documentation
  - [x] 2.4: Ensure error handling propagates correctly

- [x] Task 3: Update logic/index.ts exports (AC: #1)
  - [x] 3.1: Export `broadcast` from logic/index.ts

- [x] Task 4: Create unit tests for broadcast (AC: #1, #2, #3)
  - [x] 4.1: Create `src/logic/broadcast.test.ts`
  - [x] 4.2: Test: Broadcasts valid signed transaction successfully
  - [x] 4.3: Test: Returns transaction hash as string
  - [x] 4.4: Test: Handles malformed JSON input gracefully
  - [x] 4.5: Test: Handles network errors with descriptive messages
  - [x] 4.6: Test: Handles missing required transaction fields
  - [x] 4.7: Test: Converts transaction format correctly for network layer

- [x] Task 5: Create integration tests for broadcast (AC: #1, #2, #3)
  - [x] 5.1: Add tests to `src/api/index.integ.test.ts`
  - [x] 5.2: Test: Broadcasts transaction successfully (if testnet available)
  - [x] 5.3: Test: Returns valid transaction hash format
  - [x] 5.4: Test: Handles network rejection errors
  - [x] 5.5: Note: Real broadcast tests should be skipped in CI (modify network)

## Dev Notes

### Epic Context

This story is part of **Epic 4: Transaction Lifecycle** which covers the complete transaction workflow:
- Story 4.1: Craft Native EGLD Transactions (backlog)
- Story 4.2: Craft ESDT Token Transactions (backlog)
- Story 4.3: Craft Delegation Transactions (backlog)
- Story 4.4: Fee Estimation (ready-for-dev)
- Story 4.5: Combine Transaction with Signature (ready-for-dev)
- **Story 4.6: Broadcast Transaction** ← Current story
- Story 4.7: Validate Transaction Intent (backlog)
- Story 4.8: Unsupported Raw Transaction Method (backlog)

**FRs Covered:** FR16 - API consumers can broadcast a signed transaction to the MultiversX network

**Dependencies:**
- Story 4.5 (combine) must be completed first - `broadcast()` receives output from `combine()`
- Story 4.4 (fee estimation) provides context for transaction structure

### Architecture Compliance

**ADR-001 (Data Transformation):** The `broadcast()` function transforms a signed transaction JSON string (from `combine()`) into the format expected by the network layer (`SignedOperation`), then calls the network API.

**ADR-002 (State Mapping):** Not applicable - this is a network operation, not state mapping.

**ADR-003 (Error Handling):** 
- For malformed JSON: throw `Error` with message `"Invalid signed transaction: malformed JSON"`
- For network errors: propagate network errors with descriptive messages
- For missing required fields: throw `Error` with message `"Invalid signed transaction: missing required fields"`

**ADR-004 (Token Handling):** Not directly applicable - broadcast works with any transaction type (native, ESDT, delegation) as long as it's properly signed.

**ADR-005 (Test Structure):** Add integration tests to existing `src/api/index.integ.test.ts` file. Note: Real broadcast tests should be skipped in CI to avoid modifying network state.

### Technical Requirements

**MultiversX Transaction Format:**

From `src/types.ts`:
```typescript
export type MultiversXProtocolTransaction = {
  nonce: number;
  value: string;
  receiver: string;
  sender: string;
  gasPrice: number;
  gasLimit: number;
  chainID: string;
  signature?: string;  // Required for broadcast
  data?: string;      // For ESDT or stake transactions
  version: number;
  options: number;
};
```

**Signed Transaction Input:**

From `combine()` (story 4.5):
- Returns JSON string containing `MultiversXProtocolTransaction` with `signature` field
- Example:
```json
{
  "nonce": 42,
  "value": "1000000000000000000",
  "receiver": "erd1...",
  "sender": "erd1...",
  "gasPrice": 1000000000,
  "gasLimit": 50000,
  "chainID": "1",
  "version": 1,
  "options": 1,
  "signature": "abc123def456..."  // Hex string from device
}
```

**Network Layer Format:**

From `src/api/apiCalls.ts` `submit()` method (lines 119-136):
```typescript
async submit(signedOperation: SignedOperation): Promise<string> {
  const transaction = {
    ...signedOperation.rawData,
    signature: signedOperation.signature,
  };

  const {
    data: {
      data: { txHash: hash },
    },
  } = await network<SubmitTransactionResponse>({
    method: "POST",
    url: `${this.API_URL}/transaction/send`,
    data: transaction,
  });

  return hash;
}
```

The `SignedOperation` type from `@ledgerhq/types-live` has:
- `signature: string` - The transaction signature
- `rawData: object` - The transaction data (without signature)

**Conversion Logic:**

The `broadcast()` function must:
1. Parse the JSON string from `combine()` → `MultiversXProtocolTransaction`
2. Extract `signature` field
3. Create `rawData` object with all fields except `signature`
4. Create `SignedOperation` object: `{ signature, rawData }`
5. Call `apiClient.submit(signedOperation)`
6. Return the transaction hash

**Transaction Hash Output:**

The network API returns:
```typescript
interface SubmitTransactionResponse {
  data: {
    txHash: string;
  };
}
```

The `broadcast()` function should return the `txHash` string directly.

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- `MultiversXApiClient` from `src/api/apiCalls.ts` for network calls
- Native `JSON.parse()` for transaction parsing
- TypeScript types from `src/types.ts` and `@ledgerhq/types-live`
- Alpaca API interface from `@ledgerhq/coin-framework/api/types`

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/broadcast.ts` | Logic function to broadcast signed transaction |
| `libs/coin-modules/coin-multiversx/src/logic/broadcast.test.ts` | Unit tests for broadcast function |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export `broadcast` function |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Wire `broadcast` to API layer (replace placeholder) |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add integration tests (with skip for real broadcasts) |

### Existing Code to Leverage

**`apiCalls.ts` - submit() method (lines 119-136):**

```typescript
async submit(signedOperation: SignedOperation): Promise<string> {
  const transaction = {
    ...signedOperation.rawData,
    signature: signedOperation.signature,
  };

  const {
    data: {
      data: { txHash: hash },
    },
  } = await network<SubmitTransactionResponse>({
    method: "POST",
    url: `${this.API_URL}/transaction/send`,
    data: transaction,
  });

  return hash;
}
```

**`sdk.ts` - broadcastTransaction() (lines 369-371):**

```typescript
export const broadcastTransaction = async (signedOperation: SignedOperation): Promise<string> => {
  return await api.submit(signedOperation);
};
```

This shows the bridge pattern, but the API `broadcast()` receives a JSON string, not a `SignedOperation`.

**Reference implementations from other coin modules:**
- `coin-filecoin/src/logic/broadcast.ts` - Shows JSON parsing pattern and network call
- `coin-algorand/src/logic/broadcast.ts` - Shows transaction hash return pattern
- `coin-evm/src/logic/broadcast.ts` - Shows error handling for network failures

### Import Pattern

Follow existing pattern from other logic files:

```typescript
// Types
import type { MultiversXProtocolTransaction } from "../types";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { MultiversXApiClient } from "../api/apiCalls";

// Network client
import MultiversXApiClient from "../api/apiCalls";
```

### Implementation Pattern

```typescript
/**
 * Broadcasts a signed transaction to the MultiversX network.
 * 
 * @param signedTx - JSON string from combine() containing signed transaction
 * @param apiClient - MultiversX API client instance for network calls
 * @returns Transaction hash as string
 * @throws Error if signedTx is malformed JSON or missing required fields
 * @throws Error if network call fails (with network error message)
 */
export async function broadcast(
  signedTx: string,
  apiClient: MultiversXApiClient,
): Promise<string> {
  // Parse the signed transaction from combine()
  let tx: MultiversXProtocolTransaction;
  try {
    tx = JSON.parse(signedTx);
  } catch {
    throw new Error("Invalid signed transaction: malformed JSON");
  }

  // Validate required fields
  if (!tx.signature) {
    throw new Error("Invalid signed transaction: missing signature");
  }

  if (!tx.nonce || !tx.sender || !tx.receiver || !tx.value || !tx.gasPrice || !tx.gasLimit || !tx.chainID) {
    throw new Error("Invalid signed transaction: missing required fields");
  }

  // Extract signature and create rawData (all fields except signature)
  const { signature, ...rawData } = tx;

  // Create SignedOperation format expected by network layer
  const signedOperation: SignedOperation = {
    signature,
    rawData,
  };

  // Call network layer
  try {
    const hash = await apiClient.submit(signedOperation);
    return hash;
  } catch (error) {
    // Propagate network errors with descriptive message
    if (error instanceof Error) {
      throw new Error(`Transaction broadcast failed: ${error.message}`);
    }
    throw new Error("Transaction broadcast failed: unknown error");
  }
}
```

**Note:** The function accepts `apiClient` as a parameter to match the pattern used by other logic functions (`getBalance`, `getSequence`, etc.) which receive the client instance.

### Testing Requirements

**Unit Tests (`src/logic/broadcast.test.ts`):**

```typescript
import { broadcast } from "./broadcast";
import MultiversXApiClient from "../api/apiCalls";

describe("broadcast", () => {
  let mockApiClient: jest.Mocked<MultiversXApiClient>;

  beforeEach(() => {
    mockApiClient = {
      submit: jest.fn(),
    } as unknown as jest.Mocked<MultiversXApiClient>;
  });

  const VALID_SIGNED_TX = JSON.stringify({
    nonce: 42,
    value: "1000000000000000000",
    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    gasPrice: 1000000000,
    gasLimit: 50000,
    chainID: "1",
    version: 1,
    options: 1,
    signature: "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  });

  it("broadcasts valid signed transaction successfully", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(result).toBe(expectedHash);
    expect(mockApiClient.submit).toHaveBeenCalledWith({
      signature: expect.any(String),
      rawData: expect.objectContaining({
        nonce: 42,
        value: "1000000000000000000",
      }),
    });
  });

  it("returns transaction hash as string", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(typeof result).toBe("string");
    expect(result).toBe(expectedHash);
  });

  it("handles malformed JSON input", async () => {
    await expect(broadcast("invalid json", mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: malformed JSON"
    );
  });

  it("handles missing signature", async () => {
    const txWithoutSignature = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      signature: undefined,
    });

    await expect(broadcast(txWithoutSignature, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing signature"
    );
  });

  it("handles network errors with descriptive messages", async () => {
    const networkError = new Error("Network timeout");
    mockApiClient.submit.mockRejectedValue(networkError);

    await expect(broadcast(VALID_SIGNED_TX, mockApiClient)).rejects.toThrow(
      "Transaction broadcast failed: Network timeout"
    );
  });

  it("converts transaction format correctly for network layer", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(mockApiClient.submit).toHaveBeenCalledWith({
      signature: expect.stringContaining("abc123"),
      rawData: expect.objectContaining({
        nonce: 42,
        value: "1000000000000000000",
        receiver: expect.any(String),
        sender: expect.any(String),
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 1,
        options: 1,
      }),
    });
    expect(mockApiClient.submit.mock.calls[0][0].rawData).not.toHaveProperty("signature");
  });

  it("handles transaction with optional data field", async () => {
    const txWithData = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      data: "dGVzdA==", // base64 encoded "test"
    });

    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(txWithData, mockApiClient);

    expect(result).toBe(expectedHash);
    expect(mockApiClient.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        rawData: expect.objectContaining({
          data: "dGVzdA==",
        }),
      })
    );
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("broadcast", () => {
  // Note: Real broadcast tests should be skipped in CI to avoid modifying network state
  // These tests require a valid signed transaction from combine() + craftTransaction()
  
  it.skip("broadcasts transaction successfully (requires testnet)", async () => {
    // This test should be skipped in CI
    // It requires:
    // 1. A valid unsigned transaction from craftTransaction()
    // 2. A valid signature (from hardware wallet or mock)
    // 3. Combined transaction from combine()
    // 4. Network access to MultiversX testnet
    
    const api = createApi();
    
    // Example flow (requires stories 4.1 and 4.5):
    // const unsignedTx = await api.craftTransaction(intent);
    // const signedTx = await api.combine(unsignedTx.transaction, signature);
    // const hash = await api.broadcast(signedTx);
    
    // expect(typeof hash).toBe("string");
    // expect(hash.length).toBeGreaterThan(0);
  });

  it("returns valid transaction hash format", async () => {
    // Test with mock - verify hash format without actual broadcast
    const api = createApi();
    
    // Mock the network call if possible, or skip this test
    // The hash should be a hex string (64 characters for MultiversX)
  });

  it("handles network rejection errors", async () => {
    // Test error handling with invalid transaction
    const api = createApi();
    
    const invalidSignedTx = JSON.stringify({
      nonce: 999999999, // Invalid nonce
      value: "1000000000000000000",
      receiver: "erd1invalid",
      sender: "erd1invalid",
      gasPrice: 1000000000,
      gasLimit: 50000,
      chainID: "1",
      version: 1,
      options: 1,
      signature: "invalid_signature",
    });

    await expect(api.broadcast(invalidSignedTx)).rejects.toThrow();
  });
});
```

**Important Testing Notes:**
- Real broadcast tests should be skipped in CI (`it.skip()`) to avoid modifying network state
- Unit tests should mock the `apiClient.submit()` method
- Integration tests can test error cases without actually broadcasting
- For full integration testing, use MultiversX testnet with test accounts

### Project Structure Notes

**Alignment with Unified Project Structure:**
- New `logic/broadcast.ts` follows established pattern from other logic functions (`getBalance.ts`, `getSequence.ts`, `combine.ts`)
- Unit tests co-located in same folder (`broadcast.test.ts`)
- Integration tests in single `index.integ.test.ts` file (ADR-005)
- Async function pattern - makes network calls via `apiClient`

**Transaction Format Consistency:**
- Input format matches `combine()` output format (JSON string with `MultiversXProtocolTransaction` + signature)
- Output format matches Alpaca API interface (transaction hash as string)
- Network layer conversion ensures compatibility with existing `submit()` method

### Previous Story Intelligence

**From Epic 1 (getBalance, getSequence, lastBlock):**
- Established pattern for logic functions: validate input → transform → call network → return
- Error message format: `"Invalid {type}: {reason}"`
- Async functions that accept `apiClient` as parameter

**From Epic 2 (listOperations):**
- JSON parsing pattern with try-catch for error handling
- Network error propagation with descriptive messages
- Type safety with TypeScript interfaces

**From Epic 3 (getStakes, getValidators):**
- Network call patterns via `apiClient`
- Error handling for network failures

**From Story 4.5 (combine):**
- JSON string input/output pattern
- Transaction structure with signature field
- Output format that matches `broadcast()` input expectations

**Key Learnings:**
1. Always validate input format before processing
2. Use descriptive error messages following ADR-003
3. Network errors should be wrapped with context
4. Match input format to previous function's output (`combine()` → `broadcast()`)
5. Network operations should be async and handle timeouts gracefully

### Git Intelligence Summary

**Recent Commits Analysis:**
- Other coin modules (Filecoin, Algorand, EVM) provide reference implementations
- Common pattern: Parse JSON → Convert format → Call network → Return hash
- Error handling for network failures is standard
- Integration tests typically skip real broadcasts in CI

**Code Patterns Established:**
- Logic functions in `logic/` folder accept `apiClient` parameter
- Unit tests mock network calls
- Integration tests skip real network modifications in CI
- JSDoc comments for public API methods
- Error messages follow ADR-003 format

### Latest Tech Information

**MultiversX Transaction Broadcasting:**
- MultiversX uses HTTP POST to `/transaction/send` endpoint
- Transaction must include signature in hex format
- Network validates signature and transaction format
- Returns transaction hash (64-character hex string) upon success
- Network rejects invalid transactions with error messages

**Transaction Hash Format:**
- MultiversX transaction hashes are 64-character hex strings
- Hash is computed from transaction data + signature
- Hash can be used to track transaction status on explorer

**Network Error Handling:**
- Network timeouts should be handled gracefully (NFR10)
- Invalid transactions return descriptive error messages
- Network connectivity issues should be caught and reported
- Error messages should help developers understand what went wrong

**Broadcast Flow:**
1. `craftTransaction()` creates unsigned transaction JSON
2. Hardware wallet signs the transaction hash
3. `combine()` adds signature to transaction → signed transaction JSON
4. `broadcast()` parses signed transaction → calls network → returns hash
5. Transaction is submitted to MultiversX network
6. Network validates and processes transaction

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.6] - Original story definition and acceptance criteria
- [Source: _bmad-output/implementation-artifacts/4-5-combine-transaction-with-signature.md] - Previous story with combine implementation details
- [Source: _bmad-output/implementation-artifacts/4-4-fee-estimation.md] - Fee estimation story for transaction context
- [Source: libs/coin-modules/coin-multiversx/src/types.ts#MultiversXProtocolTransaction] - Transaction type definition
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts#submit] - Network layer submit method
- [Source: libs/coin-modules/coin-multiversx/src/api/sdk.ts#broadcastTransaction] - Bridge implementation reference
- [Source: libs/coin-modules/coin-filecoin/src/logic/broadcast.ts] - Reference implementation pattern
- [Source: libs/coin-modules/coin-algorand/src/logic/broadcast.ts] - Reference implementation pattern
- [Source: libs/coin-modules/coin-evm/src/logic/broadcast.ts] - Reference implementation pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-001] - Data transformation patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-003] - Error handling patterns

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

N/A

### Completion Notes List

✅ **Task 1 Complete**: Created `broadcast()` logic function in `src/logic/broadcast.ts`
- Parses signed transaction JSON string from `combine()`
- Validates required fields (signature, nonce, sender, receiver, value, gasPrice, gasLimit, chainID)
- **Enhanced validation (Code Review Fixes):**
  - Address format validation using `isValidAddress()` for sender and receiver
  - Signature validation (rejects empty strings and whitespace-only)
  - Numeric range validation (nonce >= 0, gasPrice > 0, gasLimit >= MIN_GAS_LIMIT)
  - Value format validation (must be valid numeric string)
  - ChainID format validation (non-empty string)
- Converts to `SignedOperation` format expected by network layer
- Calls `apiClient.submit()` and returns transaction hash
- Handles malformed JSON with descriptive error messages
- Handles network errors with descriptive messages per ADR-003
- **Enhanced error handling:** Preserves original error context (cause and stack) for better debugging

✅ **Task 2 Complete**: Wired broadcast to API layer
- Imported `broadcast` function in `src/api/index.ts`
- Replaced placeholder implementation with actual `doBroadcast()` call
- Added comprehensive JSDoc documentation
- Error handling propagates correctly from logic layer

✅ **Task 3 Complete**: Updated logic/index.ts exports
- Exported `broadcast` function from `logic/index.ts`

✅ **Task 4 Complete**: Created comprehensive unit tests
- Created `src/logic/broadcast.test.ts` with 20+ test cases (expanded from 8)
- Tests cover all acceptance criteria: valid broadcasts, hash return, error handling
- Tests validate transaction format conversion for network layer
- **Enhanced test coverage (Code Review Fixes):**
  - Empty string signature validation
  - Whitespace-only signature validation
  - Invalid address format validation (sender and receiver)
  - Negative numeric values (nonce, gasPrice)
  - GasLimit below minimum validation
  - Invalid value format (non-numeric strings)
  - Empty/whitespace chainID validation
  - Error context preservation test
- Tests cover edge cases: malformed JSON, missing fields, network errors

✅ **Task 5 Complete**: Created integration tests
- Added integration tests to `src/api/index.integ.test.ts`
- Real broadcast test marked with `it.skip()` to avoid modifying network state in CI
- Tests cover error handling scenarios (malformed JSON, missing signature, missing fields)
- **Fixed integration test naming (Code Review Fix):**
  - Renamed "handles network rejection errors" to "handles validation errors for invalid transaction format" (more accurate)
  - Added tests for invalid address formats and negative numeric values
- Tests validate validation error handling (network rejection requires actual network call with MSW)

**Implementation Summary:**
- Follows established patterns from other logic functions (`getBalance`, `getSequence`, `combine`)
- Matches ADR-001 (Data Transformation) - transforms JSON string to `SignedOperation`
- Matches ADR-003 (Error Handling) - descriptive error messages for all failure cases
- All acceptance criteria satisfied:
  - AC #1: Returns transaction hash upon successful submission ✅
  - AC #2: Throws error with rejection reason for network rejections ✅
  - AC #3: Throws descriptive error for network timeouts/connectivity issues ✅

**Code Review Fixes Applied (2026-02-03):**
- ✅ Added address validation using `isValidAddress()` for sender and receiver
- ✅ Enhanced signature validation to catch empty strings and whitespace-only signatures
- ✅ Added numeric range validation (nonce >= 0, gasPrice > 0, gasLimit >= MIN_GAS_LIMIT)
- ✅ Improved error handling to preserve original error context (cause and stack)
- ✅ Added value format validation (must be valid numeric string)
- ✅ Added chainID format validation (non-empty string)
- ✅ Fixed integration test naming ("handles validation errors" instead of misleading "network rejection")
- ✅ Added comprehensive test coverage for edge cases (empty signatures, invalid addresses, negative values, invalid formats)
- ✅ Added test for error context preservation

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/broadcast.ts` - Broadcast logic function
- `libs/coin-modules/coin-multiversx/src/logic/broadcast.test.ts` - Unit tests for broadcast

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added broadcast export
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Wired broadcast to API layer, replaced placeholder
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for broadcast
