# Story 5.6: Edge Case Integration Tests

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **QA/Test Engineer**,
I want integration tests covering edge cases,
So that I can verify the API handles unusual scenarios correctly.

## Acceptance Criteria

1. **Given** an empty account (no balance, no history)
   **When** `getBalance` is called
   **Then** it returns `[{ value: 0n, asset: { type: "native" } }]` (not empty array per FR4)

2. **Given** an account with no transaction history
   **When** `listOperations` is called
   **Then** it returns an empty array without error

3. **Given** an account with no delegations
   **When** `getStakes` is called
   **Then** it returns an empty array without error

4. **Given** a very active account with many transactions
   **When** `listOperations` is called with pagination
   **Then** pagination works correctly across multiple pages

## Tasks / Subtasks

- [ ] Task 1: Create dedicated edge case test describe block (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1: Add `describe("Edge Cases - Empty and New Accounts")` section
  - [ ] Subtask 1.2: Group all edge case tests logically by scenario type
  - [ ] Subtask 1.3: Document test addresses in comments with reasoning

- [ ] Task 2: Test `getBalance` edge cases (AC: #1)
  - [ ] Subtask 2.1: Test empty account returns native balance with 0n (not empty array)
  - [ ] Subtask 2.2: Test new account (never transacted) returns correct structure
  - [ ] Subtask 2.3: Test account with only EGLD (no ESDT) returns only native balance
  - [ ] Subtask 2.4: Verify balance array structure matches FR4 compliance

- [ ] Task 3: Test `listOperations` edge cases (AC: #2, #4)
  - [ ] Subtask 3.1: Test account with zero transaction history returns `[]`
  - [ ] Subtask 3.2: Test very active account pagination across multiple pages
  - [ ] Subtask 3.3: Verify cursor-based pagination has no duplicates
  - [ ] Subtask 3.4: Test pagination boundary conditions (last page, empty page)

- [ ] Task 4: Test `getStakes` edge cases (AC: #3)
  - [ ] Subtask 4.1: Test account with no delegations returns `{ items: [], next: undefined }`
  - [ ] Subtask 4.2: Test system contract address (known to have no delegations)
  - [ ] Subtask 4.3: Verify Page structure is returned even when empty

- [ ] Task 5: Test `getSequence` edge cases
  - [ ] Subtask 5.1: Test new account returns 0n nonce
  - [ ] Subtask 5.2: Test system contract address returns valid nonce

- [ ] Task 6: Test invalid address handling edge cases
  - [ ] Subtask 6.1: Verify all methods throw consistent error for invalid address format
  - [ ] Subtask 6.2: Test truncated/malformed bech32 addresses
  - [ ] Subtask 6.3: Test empty string address

- [ ] Task 7: Test network error edge cases
  - [ ] Subtask 7.1: Test API with invalid endpoint throws descriptive error
  - [ ] Subtask 7.2: Verify error messages are consistent across methods

- [ ] Task 8: Run tests and verify all pass
  - [ ] Subtask 8.1: Execute `pnpm test-integ` in coin-multiversx
  - [ ] Subtask 8.2: Verify no regressions in existing tests
  - [ ] Subtask 8.3: Confirm all edge case tests pass against mainnet

## Dev Notes

### Current Edge Case Test Coverage Status

**Already Present in `src/api/index.integ.test.ts` (review for completeness):**

| Test | Description | Status |
|------|-------------|--------|
| `getBalance` zero balance | Tests system contract with 0 balance | ✅ Exists (line 53-59) |
| `listOperations` no history | Tests zero balance address operations | ⚠️ Partial (line 255-258) |
| `getStakes` no delegations | Tests system contract for delegations | ✅ Exists (line 543-549) |
| Pagination tests | Tests cursor-based pagination | ✅ Exists (line 1643-1733) |

**Needs Enhancement/Addition:**

| Test | Gap |
|------|-----|
| `getBalance` - truly empty account | Need more explicit FR4 assertion |
| `listOperations` - empty result structure | Need explicit tuple structure check |
| `getStakes` - Page structure verification | Need explicit Page<Stake> check |
| `getSequence` - new account | Need 0n edge case test |
| Invalid address - all methods | Need comprehensive error format check |
| Network errors - consistent format | Need error message pattern verification |

### Test Addresses for Edge Cases

Use these known mainnet addresses (add to `TEST_ADDRESSES` constant):

```typescript
const TEST_ADDRESSES = {
  // Existing addresses...
  
  // Edge case addresses:
  
  // System smart contract - guaranteed 0 balance, no history, no delegations
  systemContract: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
  
  // Staking smart contract - may have interactions but different behavior
  stakingContract: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
  
  // Very active account for pagination testing (use existing withEgld or find alternative)
  highActivity: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
};
```

### Test Structure Pattern (CRITICAL - Follow Exactly)

Per ADR-005 and project-context.md, all integration tests go in single file:

```typescript
// ✅ CORRECT - Grouped edge case tests
describe("MultiversX API Integration Tests", () => {
  // ... existing tests ...

  // NEW: Dedicated edge case section
  describe("Edge Cases - Empty and New Accounts (Story 5.6)", () => {
    describe("getBalance edge cases", () => {
      it("returns native balance 0n for empty account (FR4 compliance)", async () => {
        const balances = await api.getBalance(TEST_ADDRESSES.systemContract);
        
        // CRITICAL: Must never return empty array per FR4
        expect(balances.length).toBeGreaterThanOrEqual(1);
        expect(balances[0]).toEqual({ 
          value: 0n, 
          asset: { type: "native" } 
        });
      });
    });
    
    describe("listOperations edge cases", () => {
      it("returns empty array for account with no history", async () => {
        const [operations, cursor] = await api.listOperations(
          TEST_ADDRESSES.systemContract, 
          { limit: 10 }
        );
        
        expect(operations).toEqual([]);
        expect(typeof cursor).toBe("string"); // Cursor format even when empty
      });
    });
  });
});
```

### FR4 Compliance - Empty Account Handling

This is the most critical edge case. Per FR4:

> API returns `{ value: 0n, asset: { type: "native" } }` for accounts with no funds (never empty array)

Test must verify:
1. Array length >= 1
2. First element is native balance
3. Value is exactly `0n` (bigint, not `0` number)
4. Asset type is exactly `{ type: "native" }`

### Pagination Edge Cases to Test

For very active accounts:

1. **First page** - Returns up to `limit` items
2. **Middle pages** - Cursor allows continuation
3. **Last page** - Returns remaining items, cursor may be empty or indicate end
4. **Beyond last page** - Returns empty array, no error
5. **No duplicates** - IDs across pages are unique
6. **Ordering preserved** - Block height order maintained across pages

### Invalid Address Error Format

Per ADR-003 and existing tests, invalid address should throw:

```typescript
// Error message pattern
/Invalid MultiversX address/

// Test pattern
await expect(api.getBalance("invalid-address"))
  .rejects.toThrow(/Invalid MultiversX address/);
```

### Network Error Handling

Test with invalid endpoint:

```typescript
const badApi = createApi({
  apiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
  delegationApiEndpoint: "https://invalid-endpoint-that-does-not-exist-12345.com",
});

// Should throw with descriptive error
await expect(badApi.getBalance(TEST_ADDRESSES.withEgld))
  .rejects.toThrow(/Failed to fetch account/);
```

### Test Timeout Configuration

Integration tests may need extended timeouts for mainnet calls:

```typescript
// In test or beforeAll
it("test name", async () => {
  // test code
}, 60000); // 60 second timeout

// Or in beforeAll for setup
beforeAll(async () => {
  // setup code
}, 120000); // 2 minute timeout for multiple API calls
```

### Project Structure Notes

- **File to modify:** `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts`
- **Test config:** `libs/coin-modules/coin-multiversx/jest.integ.config.js`
- **Run command:** `pnpm coin:multiversx test-integ`
- **All tests in single file** per ADR-005

### Verification Commands

After implementation:

```bash
# Run integration tests
pnpm coin:multiversx test-integ

# Run only edge case tests (by name pattern)
pnpm coin:multiversx test-integ --testNamePattern="Edge Cases"

# Run with verbose output
pnpm coin:multiversx test-integ --verbose
```

### References

- [Source: project-context.md#Testing Rules]
- [Source: architecture.md#ADR-005 Test Structure]
- [Source: epics.md#Story 5.6: Edge Case Integration Tests]
- [Source: FR4 - Empty account handling requirement]
- [Source: FR29 - Integration tests include edge cases]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
