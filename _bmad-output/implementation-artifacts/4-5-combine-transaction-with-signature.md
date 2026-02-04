# Story 4.5: Combine Transaction with Signature

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to combine an unsigned transaction with a signature,
So that I can produce a signed transaction ready for broadcast.

## Acceptance Criteria

1. **Given** an unsigned transaction from `craftTransaction`
   **When** I call `api.combine(unsignedTx, signature)`
   **Then** I receive a signed transaction ready for broadcasting

2. **Given** a valid signature from hardware wallet
   **When** combined with the unsigned transaction
   **Then** the resulting transaction includes the signature in the correct format

3. **Given** an invalid or malformed signature
   **When** I call `api.combine(unsignedTx, signature)`
   **Then** the combination still proceeds (validation happens on broadcast)

## Tasks / Subtasks

- [x] Task 1: Create `combine()` logic function (AC: #1, #2, #3)
  - [x] 1.1: Create `src/logic/combine.ts` file
  - [x] 1.2: Parse unsigned transaction JSON string
  - [x] 1.3: Add signature field to transaction object
  - [x] 1.4: Return signed transaction as JSON string
  - [x] 1.5: Handle malformed JSON gracefully (AC: #3)
  - [x] 1.6: Ensure output format matches `broadcast` expectations

- [x] Task 2: Wire combine to API layer (AC: #1, #2)
  - [x] 2.1: Import `combine` function in `src/api/index.ts`
  - [x] 2.2: Replace placeholder `combine` implementation
  - [x] 2.3: Add JSDoc documentation
  - [x] 2.4: Ensure signature parameter handling matches interface

- [x] Task 3: Update logic/index.ts exports (AC: #1)
  - [x] 3.1: Export `combine` from logic/index.ts

- [x] Task 4: Create unit tests for combine (AC: #1, #2, #3)
  - [x] 4.1: Create `src/logic/combine.test.ts`
  - [x] 4.2: Test: Combines valid unsigned transaction with signature
  - [x] 4.3: Test: Returns JSON string with signature field
  - [x] 4.4: Test: Handles malformed JSON input gracefully
  - [x] 4.5: Test: Handles empty signature string (AC: #3)
  - [x] 4.6: Test: Preserves all transaction fields when adding signature
  - [x] 4.7: Test: Output format matches expected broadcast format

- [x] Task 5: Create integration tests for combine (AC: #1, #2)
  - [x] 5.1: Add tests to `src/api/index.integ.test.ts`
  - [x] 5.2: Test: Combines transaction with valid signature
  - [x] 5.3: Test: Resulting transaction has signature field
  - [x] 5.4: Test: Combined transaction can be parsed as valid JSON
  - [x] 5.5: Test: Signature format matches MultiversX protocol expectations

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** The `combine()` function is a pure transformation function that takes an unsigned transaction and signature, producing a signed transaction. It should be placed in `src/logic/combine.ts` following the pattern of other logic functions.

**ADR-002 (State Mapping):** Not applicable - this is a transaction transformation, not state mapping.

**ADR-003 (Error Handling):** For malformed JSON input, throw `Error` with descriptive message: `"Invalid unsigned transaction: malformed JSON"`. However, per acceptance criteria #3, invalid signatures should NOT cause errors - validation happens at broadcast time.

**ADR-004 (Token Handling):** Not directly applicable - combine works with any transaction type (native, ESDT, delegation) as long as it's in the correct unsigned format.

**ADR-005 (Test Structure):** Add integration tests to existing `src/api/index.integ.test.ts` file.

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
  signature?: string;  // Added by combine()
  data?: string;      // For ESDT or stake transactions
  version: number;
  options: number;
};
```

**Signature Format:**

From `src/signOperation.ts` (line 83):
- Signature comes from hardware wallet as `Buffer`
- Converted to hex string: `signature.toString("hex")`
- Stored in transaction as hex string: `signature: "abc123..."`

**Unsigned Transaction Input:**

From `craftTransaction()` (tech spec):
- Returns `{ transaction: string, details: object }`
- The `transaction` field is a JSON string containing `MultiversXProtocolTransaction` (without signature)
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
  "version": 2,
  "options": 1
}
```

**Signed Transaction Output:**

The `combine()` function should return a JSON string with the same structure plus the `signature` field:
```json
{
  "nonce": 42,
  "value": "1000000000000000000",
  "receiver": "erd1...",
  "sender": "erd1...",
  "gasPrice": 1000000000,
  "gasLimit": 50000,
  "chainID": "1",
  "version": 2,
  "options": 1,
  "signature": "abc123def456..."  // Hex string from device
}
```

**Broadcast Compatibility:**

The output from `combine()` must be compatible with `broadcast()` method (story 4.6). Looking at existing `apiCalls.ts` `submit()` method (lines 119-123):

```typescript
async submit(signedOperation: SignedOperation): Promise<string> {
  const transaction = {
    ...signedOperation.rawData,
    signature: signedOperation.signature,
  };
  // ...
}
```

This shows that `broadcast()` expects the transaction object with signature field already included. The `combine()` output should match this format.

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- Native `JSON.parse()` and `JSON.stringify()` for transaction parsing
- TypeScript types from `src/types.ts`
- Alpaca API interface from `@ledgerhq/coin-framework/api/types`

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/combine.ts` | Logic function to combine unsigned transaction with signature |
| `libs/coin-modules/coin-multiversx/src/logic/combine.test.ts` | Unit tests for combine function |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export `combine` function |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Wire `combine` to API layer (replace placeholder) |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add integration tests |

### Existing Code to Leverage

**`apiCalls.ts` - submit() method (reference for expected format):**

```typescript
async submit(signedOperation: SignedOperation): Promise<string> {
  const transaction = {
    ...signedOperation.rawData,
    signature: signedOperation.signature,
  };
  // ...
}
```

**`signOperation.ts` - signature format (line 83):**

```typescript
signature: signature.toString("hex"),
```

**`buildTransaction.ts` - transaction structure:**

Shows the exact structure of `MultiversXProtocolTransaction` that `craftTransaction()` will produce.

**Reference implementations from other coin modules:**

- `coin-filecoin/src/logic/combine.ts` - Shows JSON parsing pattern and error handling
- `coin-algorand/src/logic/combine.ts` - Shows hex signature handling
- `coin-xrp/src/logic/combine.ts` - Shows transaction modification pattern

### Import Pattern

Follow existing pattern from other logic files:

```typescript
// Types
import type { MultiversXProtocolTransaction } from "../types";

// No external dependencies needed - pure function
```

### Implementation Pattern

```typescript
/**
 * Combines an unsigned transaction with a signature to produce a signed transaction.
 * 
 * @param unsignedTx - JSON string from craftTransaction containing unsigned transaction
 * @param signature - Hex-encoded signature from hardware wallet
 * @param _pubkey - Optional public key (not used for MultiversX, kept for interface compliance)
 * @returns JSON string containing signed transaction ready for broadcast
 * @throws Error if unsignedTx is malformed JSON
 */
export function combine(unsignedTx: string, signature: string, _pubkey?: string): string {
  // Parse the unsigned transaction
  let tx: MultiversXProtocolTransaction;
  try {
    tx = JSON.parse(unsignedTx);
  } catch {
    throw new Error("Invalid unsigned transaction: malformed JSON");
  }

  // Add signature to transaction
  const signedTx: MultiversXProtocolTransaction = {
    ...tx,
    signature,
  };

  // Return as JSON string
  return JSON.stringify(signedTx);
}
```

**Note:** Per acceptance criteria #3, we don't validate the signature format - invalid signatures will be caught by the network during broadcast. The function simply adds the signature field to the transaction.

### Testing Requirements

**Unit Tests (`src/logic/combine.test.ts`):**

```typescript
import { combine } from "./combine";

describe("combine", () => {
  const VALID_UNSIGNED_TX = JSON.stringify({
    nonce: 42,
    value: "1000000000000000000",
    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    gasPrice: 1000000000,
    gasLimit: 50000,
    chainID: "1",
    version: 2,
    options: 1,
  });

  const VALID_SIGNATURE = "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  it("combines valid unsigned transaction with signature", () => {
    const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
    
    const parsed = JSON.parse(result);
    expect(parsed.signature).toBe(VALID_SIGNATURE);
    expect(parsed.nonce).toBe(42);
    expect(parsed.value).toBe("1000000000000000000");
  });

  it("preserves all transaction fields when adding signature", () => {
    const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
    const parsed = JSON.parse(result);
    
    expect(parsed.nonce).toBe(42);
    expect(parsed.value).toBe("1000000000000000000");
    expect(parsed.receiver).toBeDefined();
    expect(parsed.sender).toBeDefined();
    expect(parsed.gasPrice).toBe(1000000000);
    expect(parsed.gasLimit).toBe(50000);
    expect(parsed.chainID).toBe("1");
      expect(parsed.version).toBe(2);
    expect(parsed.options).toBe(1);
  });

  it("handles malformed JSON input", () => {
    expect(() => combine("invalid json", VALID_SIGNATURE)).toThrow(
      "Invalid unsigned transaction: malformed JSON"
    );
  });

  it("handles empty signature string (per AC #3)", () => {
    const result = combine(VALID_UNSIGNED_TX, "");
    const parsed = JSON.parse(result);
    expect(parsed.signature).toBe("");
  });

  it("returns JSON string format", () => {
    const result = combine(VALID_UNSIGNED_TX, VALID_SIGNATURE);
    expect(typeof result).toBe("string");
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("handles transaction with optional data field", () => {
    const txWithData = JSON.stringify({
      ...JSON.parse(VALID_UNSIGNED_TX),
      data: "dGVzdA==", // base64 encoded "test"
    });
    
    const result = combine(txWithData, VALID_SIGNATURE);
    const parsed = JSON.parse(result);
    expect(parsed.data).toBe("dGVzdA==");
    expect(parsed.signature).toBe(VALID_SIGNATURE);
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("combine", () => {
  it("combines transaction with valid signature", async () => {
    // Note: This test requires a valid unsigned transaction from craftTransaction
    // For now, we'll use a mock unsigned transaction structure
    const unsignedTx = JSON.stringify({
      nonce: 0,
      value: "1000000000000000000",
      receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
      gasPrice: 1000000000,
      gasLimit: 50000,
      chainID: "1",
      version: 2,
      options: 1,
    });

    const signature = "test_signature_hex_string_64_chars_long_1234567890123456789012345678901234567890123456789012345678901234";

    const result = await api.combine(unsignedTx, signature);

    expect(typeof result).toBe("string");
    const parsed = JSON.parse(result);
    expect(parsed.signature).toBe(signature);
    expect(parsed.nonce).toBe(0);
  });

  it("resulting transaction has signature field", async () => {
      const unsignedTx = JSON.stringify({
        nonce: 1,
        value: "0",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

    const signature = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const result = await api.combine(unsignedTx, signature);
    const parsed = JSON.parse(result);

    expect(parsed).toHaveProperty("signature");
    expect(parsed.signature).toBe(signature);
  });

  it("combined transaction can be parsed as valid JSON", async () => {
      const unsignedTx = JSON.stringify({
        nonce: 2,
        value: "500000000000000000",
        receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 2,
        options: 1,
      });

    const signature = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    const result = await api.combine(unsignedTx, signature);

    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });
});
```

### Project Structure Notes

**Alignment with Unified Project Structure:**

- New `logic/combine.ts` follows established pattern from other logic functions (`getBalance.ts`, `getSequence.ts`)
- Unit tests co-located in same folder (`combine.test.ts`)
- Integration tests in single `index.integ.test.ts` file (ADR-005)
- Pure function pattern - no side effects, no network calls

**Transaction Format Consistency:**

The `combine()` function must ensure the output format matches what `broadcast()` expects. Based on `apiCalls.ts` `submit()` method, the transaction object with signature field is the expected format.

### Previous Story Intelligence

**From Epic 1 (getBalance, getSequence, lastBlock):**

- Established pattern for logic functions: validate input → transform → return
- Error message format: `"Invalid {type}: {reason}"`
- Pure functions with no side effects

**From Epic 2 (listOperations):**

- JSON parsing pattern with try-catch for error handling
- Type safety with TypeScript interfaces

**From Epic 3 (getStakes, getValidators):**

- Mapper function patterns
- Test structure and coverage expectations

**Key Learnings:**

1. Always validate input format before processing
2. Use descriptive error messages following ADR-003
3. Pure functions are easier to test and reason about
4. Match output format to what downstream functions expect (broadcast)

### Git Intelligence Summary

**Recent Commits Analysis:**

- Other coin modules (Filecoin, Algorand, XRP, Aptos) provide reference implementations
- Common pattern: Parse unsigned transaction → Add signature → Return signed transaction
- Error handling for malformed JSON is standard
- Some modules (XRP, Hedera) use public key parameter, but MultiversX doesn't need it

**Code Patterns Established:**

- Pure logic functions in `logic/` folder
- Unit tests co-located with source files
- Integration tests in `api/index.integ.test.ts`
- JSDoc comments for public API methods

### Latest Tech Information

**MultiversX Signature Format:**

- MultiversX uses ECDSA signatures (secp256k1)
- Signature is 64 bytes (128 hex characters)
- Signature is appended to transaction as hex string
- Network validates signature during broadcast

**Transaction Signing Flow:**

1. `craftTransaction()` creates unsigned transaction JSON
2. Hardware wallet signs the transaction hash
3. `combine()` adds signature to transaction
4. `broadcast()` submits signed transaction to network

**Signature Validation:**

- Per acceptance criteria #3, `combine()` does NOT validate signature format
- Invalid signatures will be rejected by the network during `broadcast()`
- This allows for flexibility and proper error handling at the network layer

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5] - Original story definition and acceptance criteria
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md#Task 12] - Technical specification for combine function
- [Source: libs/coin-modules/coin-multiversx/src/types.ts#MultiversXProtocolTransaction] - Transaction type definition
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts#submit] - Expected format for signed transactions
- [Source: libs/coin-modules/coin-multiversx/src/signOperation.ts] - Signature format from hardware wallet
- [Source: libs/coin-modules/coin-filecoin/src/logic/combine.ts] - Reference implementation pattern
- [Source: libs/coin-modules/coin-algorand/src/logic/combine.ts] - Reference implementation pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None required - clean implementation with all tests passing on first attempt.

### Completion Notes List

- ✅ Implemented `combine()` function as pure transformation function in `src/logic/combine.ts`
- ✅ Function parses unsigned transaction JSON, adds signature field, returns signed transaction JSON
- ✅ Error handling for malformed JSON with descriptive error message per ADR-003 (includes original error details)
- ✅ Runtime type validation ensures parsed transaction matches MultiversXProtocolTransaction structure
- ✅ Invalid signatures are NOT validated (per AC #3) - validation happens at broadcast time
- ✅ Wired combine to API layer replacing placeholder implementation
- ✅ Added JSDoc documentation with clear parameter descriptions and usage example
- ✅ Created comprehensive unit tests (18 tests) covering all acceptance criteria, edge cases, and validation
- ✅ Created integration tests (7 tests) in `index.integ.test.ts` including combine → broadcast chain test
- ✅ All unit tests pass with no regressions
- ✅ No linter errors

### Code Review Fixes Applied (2026-02-03)

**HIGH Priority Fixes:**
- ✅ Added runtime type validation to ensure parsed transaction matches expected structure
- ✅ Improved error handling to preserve original JSON.parse error messages
- ✅ Added test for transaction with existing signature field (edge case)
- ✅ Updated story documentation examples to use correct version (2 instead of 1)
- ✅ Staged untracked files (combine.ts, combine.test.ts) to git
- ✅ Resolved incomplete git commit for index.integ.test.ts

**MEDIUM Priority Fixes:**
- ✅ Added integration test validating combine() output is compatible with broadcast() input
- ✅ Enhanced JSDoc with usage example
- ✅ Added validation tests for missing/invalid required fields

### Change Log

- 2026-02-03: Implemented Story 4.5 - Combine Transaction with Signature
  - Created `combine()` logic function for transaction signing
  - Added unit tests (18 tests) and integration tests (7 tests)
  - Wired to API layer with JSDoc documentation
  - Applied code review fixes: added runtime validation, improved error handling, fixed documentation version mismatch

### File List

**Files Created:**
- `libs/coin-modules/coin-multiversx/src/logic/combine.ts` - Logic function to combine unsigned transaction with signature (with runtime validation)
- `libs/coin-modules/coin-multiversx/src/logic/combine.test.ts` - Unit tests for combine function (18 tests including validation and edge cases)

**Files Modified:**
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added export for combine function
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Wired combine to API layer with JSDoc
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for combine (7 tests including combine → broadcast chain test)
