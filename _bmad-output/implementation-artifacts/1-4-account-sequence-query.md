# Story 1.4: Account Sequence Query

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to retrieve the account nonce (sequence) for any MultiversX address,
So that I can craft transactions with the correct sequence number.

## Acceptance Criteria

1. **Given** a valid MultiversX address with transaction history  
   **When** I call `api.getSequence(address)`  
   **Then** I receive the account nonce as a `bigint`

2. **Given** a new MultiversX address with no transactions  
   **When** I call `api.getSequence(address)`  
   **Then** I receive `0n` as the nonce

3. **Given** an invalid MultiversX address  
   **When** I call `api.getSequence(address)`  
   **Then** an error is thrown with a descriptive message

## Tasks / Subtasks

- [x] Task 1: Implement `getSequence` method in `src/api/index.ts` (AC: #1, #2, #3)
  - [x] Add `getSequence` function that calls existing `getAccountNonce` from network layer
  - [x] Convert `INonce` return type to `bigint` as required by Api interface
  - [x] Handle new accounts returning `0n`
  - [x] Add error handling for invalid addresses

- [x] Task 2: Add unit tests for `getSequence` in `src/api/index.test.ts` (AC: #1, #2, #3)
  - [x] Test valid address with transaction history returns bigint nonce
  - [x] Test new address returns `0n`
  - [x] Test invalid address throws descriptive error
  - [x] Mock network layer for deterministic testing

- [x] Task 3: Add integration test for `getSequence` in `src/api/index.integ.test.ts` (AC: #1, #2)
  - [x] Test against real MultiversX mainnet
  - [x] Use known mainnet address with predictable nonce
  - [x] Verify return type is `bigint`

## Dev Notes

### Technical Implementation

**Existing Implementation to Leverage:**

The implementation uses `api.getAccountDetails()` from `MultiversXApiClient` (consistent with `getBalance` pattern):

```typescript
const { nonce } = await api.getAccountDetails(address);
return BigInt(nonce);
```

**Note:** While `getAccountNonce` exists in `src/api/sdk.ts`, we use `getAccountDetails()` for consistency with other API methods like `getBalance`, which already fetches account details. This approach is more efficient and maintains consistency.

**Key Implementation Details:**

1. **Type Conversion:** The API returns `nonce` as a `number`, which is converted to `bigint`:
   ```typescript
   const { nonce } = await api.getAccountDetails(address);
   return BigInt(nonce);
   ```

2. **Validation:** Added comprehensive validation:
   - Address validation using `isValidAddress()`
   - Null/undefined nonce check
   - Type validation (must be number)
   - Non-negative validation (nonce >= 0)

3. **Error Handling:** Wraps network errors with context per ADR-003, using consistent error message format matching `getBalance`:
   ```typescript
   throw new Error(`Failed to fetch account ${address}: ${message}`);
   ```

### Architecture Compliance

| Requirement | Implementation |
|------------|----------------|
| Return type | `bigint` (Api interface requirement) |
| Error format | Descriptive message with address context |
| Source location | `src/api/index.ts` |
| Tests | Unit + Integration (ADR-005) |

### Dependencies

**Story Dependencies:**
- **Story 1.1 (API Factory & Configuration):** Must be completed first - provides `createApi()` factory where `getSequence` will be added

**Technical Dependencies:**
- `@multiversx/sdk-core`: `Address`, `ApiNetworkProvider` for network calls
- Existing `src/api/sdk.ts`: `getAccountNonce` function
- Existing `src/api/apiCalls.ts`: `getAccountDetails` for alternative implementation

### Library/Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| `@multiversx/sdk-core` | (existing) | `Address`, `INonce`, `ApiNetworkProvider` |
| `@ledgerhq/coin-framework` | (monorepo) | `Api` interface type definition |
| `jest` | (monorepo) | Unit and integration testing |

### File Structure Requirements

**Files to Modify:**

| File | Change |
|------|--------|
| `src/api/index.ts` | Add `getSequence` method to `createApi()` return object |
| `src/api/index.test.ts` | Add unit tests for `getSequence` |
| `src/api/index.integ.test.ts` | Add integration tests for `getSequence` |

**No New Files Required** - implementation goes into existing API files created in Story 1.1.

### Testing Requirements

**Unit Tests (`src/api/index.test.ts`):**

```typescript
describe("getSequence", () => {
  it("returns nonce as bigint for address with history", async () => {
    // Mock getAccountNonce to return a known value
    // Verify return is bigint type
  });
  
  it("returns 0n for new address", async () => {
    // Mock getAccountNonce to return 0
    // Verify return is 0n
  });
  
  it("throws descriptive error for invalid address", async () => {
    // Mock network to throw error
    // Verify error message contains address
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("getSequence", () => {
  it("returns nonce for known mainnet address", async () => {
    // Use real mainnet address with known transaction history
    // Verify result is bigint
    // Verify result >= 0n
  });
});
```

**Test Addresses:**
- Use known MultiversX mainnet addresses from existing test datasets
- Reference: `src/datasets/multiversx1.ts` for example addresses

### Project Structure Notes

- Implementation follows established `api/` folder pattern from coin-filecoin reference
- `getSequence` is part of `BridgeApi` interface (line 546 of `coin-framework/api/types.ts`)
- Function signature: `getSequence: (address: string) => Promise<bigint>`

### Reference Implementation

**coin-filecoin Pattern (lines 167-169 of `coin-filecoin/src/api/index.ts`):**

```typescript
async function getSequence(address: string): Promise<bigint> {
  return logicGetSequence(address);
}
```

For MultiversX, adapt to use existing `getAccountNonce`:

```typescript
async function getSequence(address: string): Promise<bigint> {
  const nonce = await getAccountNonce(address);
  return BigInt(nonce.valueOf());
}
```

### References

- [Source: libs/coin-framework/src/api/types.ts#L546] - `getSequence` interface definition
- [Source: libs/coin-modules/coin-filecoin/src/api/index.ts#L167-169] - Reference implementation
- [Source: libs/coin-modules/coin-multiversx/src/api/sdk.ts#L64-70] - Existing `getAccountNonce` function
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-003] - Error handling pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4] - Original story definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None - implementation completed without issues.

### Completion Notes List

- **Task 1 Complete:** Implemented `getSequence` method following the established pattern from `getBalance`. Created a dedicated logic function `src/logic/getSequence.ts` that:
  - Validates address using existing `isValidAddress` function
  - Calls `apiClient.getAccountDetails()` which already returns the nonce
  - Converts `number` nonce to `bigint` as required by the Api interface
  - Returns `0n` for new accounts (accounts with nonce = 0)
  - Wraps errors with descriptive messages including the address

- **Task 2 Complete:** Added comprehensive unit tests:
  - Logic function tests in `src/logic/getSequence.test.ts` (12 tests including edge cases)
  - API integration tests in `src/api/index.test.ts` (4 new tests)
  - Tests cover: valid addresses, new accounts (0n), invalid addresses, network errors, null/undefined nonce, type validation, negative nonce

- **Task 3 Complete:** Added integration tests in `src/api/index.integ.test.ts` (6 tests):
  - Tests against real MultiversX mainnet
  - Verifies return type is `bigint`
  - Tests both active accounts and system contracts
  - Verifies error handling for invalid addresses
  - Validates non-negative nonce constraint
  - Verifies consistent error message format

- **All Acceptance Criteria Met:**
  - AC#1: ✅ Returns bigint nonce for valid address with history
  - AC#2: ✅ Returns 0n for new address
  - AC#3: ✅ Throws descriptive error for invalid address

### Change Log

- 2026-01-30: Implemented getSequence feature (Story 1.4)
  - Created logic function with address validation and error handling
  - Added 12 new unit tests (8 logic + 4 API)
  - Added 4 integration tests against mainnet
  - All 52 unit tests pass, all 10 integration tests pass

- 2026-01-30: Code review fixes (AI Review)
  - Added `getSequence` export to `logic/index.ts` for module consistency
  - Added null/undefined safety checks and type validation for nonce
  - Added negative nonce validation
  - Standardized error message format to match `getBalance` pattern
  - Added edge case tests (null, undefined, non-number, negative nonce)
  - Added integration tests for error message consistency and non-negative validation
  - Updated dev notes to reflect actual implementation using `getAccountDetails()`
  - Updated File List to include `logic/index.ts` modification

### Senior Developer Review (AI)

**Review Date:** 2026-01-30  
**Reviewer:** AI Code Reviewer  
**Status:** ✅ Approved (after fixes)

**Issues Found:** 10 total (6 High, 2 Medium, 2 Low)

**Critical Issues Fixed:**
1. ✅ **Missing export in logic module** - Added `getSequence` export to `logic/index.ts`
2. ✅ **Missing null/undefined safety** - Added comprehensive validation for null, undefined, type, and negative values
3. ✅ **Type safety gap** - Added explicit type checking before BigInt conversion
4. ✅ **Dev Notes discrepancy** - Updated documentation to reflect actual `getAccountDetails()` implementation
5. ✅ **Error message inconsistency** - Standardized to match `getBalance` pattern: `"Failed to fetch account ${address}"`
6. ✅ **Integration test gaps** - Added edge case validation and error message consistency tests

**Medium Issues Fixed:**
7. ✅ **File List incomplete** - Added `logic/index.ts` to modified files
8. ✅ **Missing negative nonce test** - Added test for negative nonce validation

**All HIGH and MEDIUM issues resolved. Story approved and marked as done.**

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/getSequence.ts` - Logic function for account sequence retrieval
- `libs/coin-modules/coin-multiversx/src/logic/getSequence.test.ts` - Unit tests for getSequence logic

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Added getSequence import and implementation
- `libs/coin-modules/coin-multiversx/src/api/index.test.ts` - Added unit tests for getSequence API method
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` - Added integration tests for getSequence
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added getSequence export for module consistency
