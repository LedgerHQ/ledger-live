# Story 4.8: Unsupported Raw Transaction Method

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want a clear error when calling `craftRawTransaction()`,
So that I understand this functionality is not needed for MultiversX.

## Acceptance Criteria

1. **Given** any parameters
   **When** I call `api.craftRawTransaction()`
   **Then** an error is thrown with message `"craftRawTransaction is not supported"`

## Tasks / Subtasks

- [x] Task 1: Verify craftRawTransaction implementation (AC: #1)
  - [x] 1.1: Verify method exists in `api/index.ts` and throws correct error
  - [x] 1.2: Verify error message format matches ADR-003: `"craftRawTransaction is not supported"`
  - [x] 1.3: Verify method signature matches Api interface requirements

- [x] Task 2: Verify unit tests exist (AC: #1)
  - [x] 2.1: Verify unit test exists in `api/index.test.ts`
  - [x] 2.2: Verify test checks error message format
  - [x] 2.3: Verify test checks error type (Error)

- [x] Task 3: Add integration tests (AC: #1)
  - [x] 3.1: Add integration test to `api/index.integ.test.ts`
  - [x] 3.2: Test with various parameter combinations
  - [x] 3.3: Verify error message exactly matches ADR-003 format
  - [x] 3.4: Verify error is thrown regardless of parameters

## Dev Notes

### Epic Context

This story is part of **Epic 4: Transaction Lifecycle** which covers the complete transaction workflow:
- Story 4.1: Craft Native EGLD Transactions (backlog)
- Story 4.2: Craft ESDT Token Transactions (ready-for-dev)
- Story 4.3: Craft Delegation Transactions (backlog)
- Story 4.4: Fee Estimation (ready-for-dev)
- Story 4.5: Combine Transaction with Signature (ready-for-dev)
- Story 4.6: Broadcast Transaction (ready-for-dev)
- Story 4.7: Validate Transaction Intent (backlog)
- **Story 4.8: Unsupported Raw Transaction Method** ← Current story

**FRs Covered:** FR19 - API throws "not supported" error for `craftRawTransaction()`

### Critical Implementation Details

**Error Message Format (ADR-003 Compliance):**
```typescript
// ✅ CORRECT - Exact format required
craftRawTransaction: async (
  _transaction: string,
  _sender: string,
  _publicKey: string,
  _sequence: bigint,
) => {
  throw new Error("craftRawTransaction is not supported");
},

// ❌ WRONG - Generic or inconsistent messages
craftRawTransaction: () => { throw new Error("Not supported"); },
craftRawTransaction: () => { throw new Error("Method not available for MultiversX"); },
```

**Method Signature:**
The `craftRawTransaction` method must match the `Api` interface signature from `@ledgerhq/coin-framework/api/types`:
```typescript
craftRawTransaction: (
  transaction: string,
  sender: string,
  publicKey: string,
  sequence: bigint,
) => Promise<CraftedTransaction>;
```

**Why MultiversX Doesn't Need Raw Transactions:**
- MultiversX uses structured transaction format (JSON-based)
- Transactions are crafted with all required fields via `craftTransaction()`
- No need for raw byte-level transaction construction
- Hardware wallet signing works with structured transactions directly

### Current Implementation Status

**✅ Already Implemented:**
- Method exists in `libs/coin-modules/coin-multiversx/src/api/index.ts` (lines 51-58)
- Error message format is correct: `"craftRawTransaction is not supported"`
- Method signature matches Api interface requirements
- Unit tests exist in `api/index.test.ts` (lines 129-141)

**❌ Missing:**
- Integration tests in `api/index.integ.test.ts`
- Verification that method works correctly in integration test environment

### Architecture Compliance

| Requirement | Implementation |
|-------------|----------------|
| ADR-003 | Error format: `"{methodName} is not supported"` ✅ |
| ADR-005 | Integration tests in single `index.integ.test.ts` file ⚠️ (needs addition) |
| NFR1 | Use MultiversX mainnet explorer endpoints (N/A - no network calls) |
| NFR10 | Handle errors gracefully ✅ |

### Reference Implementation

**coin-filecoin pattern (similar unsupported method):**
```typescript
// libs/coin-modules/coin-filecoin/src/api/index.ts
async function craftRawTransaction(): Promise<CraftedTransaction> {
  throw new Error("craftRawTransaction is not supported for Filecoin");
}
```

**coin-algorand pattern:**
```typescript
// libs/coin-modules/coin-algorand/src/api/index.ts
async function craftRawTransaction(
  _transaction: string,
  _sender: string,
  _publicKey: string,
  _sequence: bigint,
): Promise<CraftedTransaction> {
  throw new Error("craftRawTransaction is not supported for Algorand");
}
```

**coin-canton pattern:**
```typescript
// libs/coin-modules/coin-canton/src/api/index.ts
craftRawTransaction: (
  _transaction: string,
  _sender: string,
  _publicKey: string,
  _sequence: bigint,
): Promise<CraftedTransaction> => {
  throw new Error("craftRawTransaction is not supported");
},
```

**Current MultiversX Implementation:**
```typescript
// libs/coin-modules/coin-multiversx/src/api/index.ts (lines 51-58)
craftRawTransaction: async (
  _transaction: string,
  _sender: string,
  _publicKey: string,
  _sequence: bigint,
) => {
  void apiClient;
  throw new Error("craftRawTransaction is not supported");
},
```

### Unsupported Methods Summary

After this story, the following methods throw "not supported" errors:
- `getRewards()` - Story 3.4 ✅
- `getBlock()` - Story 1.5 ✅
- `getBlockInfo()` - Story 1.5 ✅
- `craftRawTransaction()` - Story 4.8 ✅ (implementation complete, integration tests needed)

### Project Structure Notes

**Files to Verify/Modify:**

| File | Change |
|------|--------|
| `src/api/index.ts` | ✅ Already implemented correctly |
| `src/api/index.test.ts` | ✅ Unit tests already exist |
| `src/api/index.integ.test.ts` | ⚠️ Add integration tests |

### Testing Requirements

#### Unit Tests (Already Complete)

The existing unit tests in `api/index.test.ts` verify:
- Method exists and is defined
- Method throws correct error message
- Error type is `Error`

**Test Pattern (Already Implemented):**
```typescript
describe("craftRawTransaction", () => {
  it("throws 'craftRawTransaction is not supported' for craftRawTransaction", async () => {
    const api = createApi();
    await expect(api.craftRawTransaction("raw", "sender", "pubkey", 1n)).rejects.toThrow(
      "craftRawTransaction is not supported",
    );
  });
});
```

#### Integration Tests (To Be Added)

Add to `api/index.integ.test.ts` following the pattern from Story 3.4 (`getRewards`):

**Test Structure:**
```typescript
// Story 4.8: Unsupported Raw Transaction Method Integration Tests
describe("craftRawTransaction (Story 4.8)", () => {
  it("throws 'not supported' error", async () => {
    await expect(
      api.craftRawTransaction("raw-tx", TEST_ADDRESSES.withEgld, "pubkey", 1n)
    ).rejects.toThrow("craftRawTransaction is not supported");
  });

  it("throws error with correct message format for any parameters", async () => {
    await expect(
      api.craftRawTransaction("", "", "", 0n)
    ).rejects.toThrow("craftRawTransaction is not supported");
  });

  it("error message exactly matches ADR-003 format", async () => {
    await expect(
      api.craftRawTransaction("raw-tx", TEST_ADDRESSES.withEgld, "pubkey", 1n)
    ).rejects.toThrow("craftRawTransaction is not supported");
    // Verify error type
    await expect(
      api.craftRawTransaction("raw-tx", TEST_ADDRESSES.withEgld, "pubkey", 1n)
    ).rejects.toThrow(Error);
  });

  it("ignores all parameters when provided", async () => {
    // Verify parameters are ignored (method throws regardless)
    await expect(
      api.craftRawTransaction("any-tx", "any-sender", "any-pubkey", 999n)
    ).rejects.toThrow("craftRawTransaction is not supported");
  });
});
```

**Test Addresses:** Use `TEST_ADDRESSES.withEgld` from existing integration tests.

### Implementation Approach

Since the method is already implemented correctly, this story focuses on:

1. **Verification**: Confirm implementation matches requirements
2. **Integration Tests**: Add comprehensive integration tests following Story 3.4 pattern
3. **Documentation**: Ensure story documentation is complete

### Dependencies on Previous Stories

This story depends on:
- **Story 1.1**: `createApi()` factory must exist ✅
- **Story 1.1**: Basic API structure in `src/api/index.ts` ✅
- **Story 3.4**: Pattern for unsupported method integration tests ✅

This story is the **final story in Epic 4** for unsupported methods. Upon completion, all "not supported" methods will be fully tested.

### References

- [Source: PRD - FR19] API throws "not supported" error for `craftRawTransaction()`
- [Source: Architecture - ADR-003] Error handling pattern for unsupported methods
- [Source: Architecture - ADR-005] Single integration test file requirement
- [Source: Project Context] Error message format: `"{methodName} is not supported"`
- [Source: Story 1.5] Pattern for unsupported method implementation and testing
- [Source: Story 3.4] Pattern for unsupported method integration tests
- [Source: coin-filecoin Reference] `libs/coin-modules/coin-filecoin/src/api/index.ts` - craftRawTransaction implementation
- [Source: coin-algorand Reference] `libs/coin-modules/coin-algorand/src/api/index.ts` - craftRawTransaction implementation
- [Source: epics.md#Story-4.8] Story requirements and acceptance criteria

### Technical Notes

- Error format per ADR-003: `"{methodName} is not supported"`
- MultiversX uses structured transaction format, not raw bytes
- No network calls required - method immediately throws error
- All parameters are ignored (prefixed with `_` in implementation)

## Dev Agent Record

### Agent Model Used

Composer (Cursor AI)

### Debug Log References

### Completion Notes List

- ✅ Added integration tests for `craftRawTransaction` following the pattern from Story 3.4 (`getRewards`)
- ✅ Tests verify error message format matches ADR-003: `"craftRawTransaction is not supported"`
- ✅ Tests verify error is thrown regardless of parameter values
- ✅ Tests verify error type is `Error`
- ✅ All 5 test cases added to `api/index.integ.test.ts`:
  - Test with valid parameters
  - Test with empty/zero parameters
  - Test error message format and type (optimized to single API call)
  - Test parameter type validation per Api interface
  - Test that parameters are ignored
- ✅ Added JSDoc documentation explaining why MultiversX doesn't support raw transactions
- ✅ Optimized integration test to avoid duplicate API calls

### File List

- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Added JSDoc documentation for craftRawTransaction
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for craftRawTransaction (Story 4.8), optimized test efficiency
