# Story 5.7: Combine Method Integration Tests

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **QA/Test Engineer**,
I want integration tests for the `combine` method with mock signatures,
So that I can verify transaction combination works correctly.

## Acceptance Criteria

1. **Given** an unsigned transaction from `craftTransaction`
   **When** combined with a mock signature
   **Then** the result is a properly formatted signed transaction

2. **Given** a native EGLD transaction
   **When** combined with a signature
   **Then** the signed transaction has correct structure

3. **Given** an ESDT token transaction
   **When** combined with a signature
   **Then** the signed transaction preserves token data

4. **Given** the combined transaction
   **When** inspected
   **Then** it contains the original transaction data plus signature

## Tasks / Subtasks

- [x] Task 1: Create end-to-end `craftTransaction` → `combine` integration tests (AC: #1, #4)
  - [x] 1.1: Test that `craftTransaction` output can be combined with mock signature
  - [x] 1.2: Test that combined result contains all original transaction fields
  - [x] 1.3: Test that combined result has signature field added
  - [x] 1.4: Test full flow: craftTransaction → combine → verify structure

- [x] Task 2: Create native EGLD transaction integration tests (AC: #2)
  - [x] 2.1: Craft native EGLD transfer transaction via API
  - [x] 2.2: Combine with mock signature
  - [x] 2.3: Verify signed transaction structure matches MultiversXProtocolTransaction
  - [x] 2.4: Verify no data field for native EGLD transfers
  - [x] 2.5: Verify value, sender, receiver preserved correctly

- [x] Task 3: Create ESDT token transaction integration tests (AC: #3)
  - [x] 3.1: Craft ESDT token transfer transaction via API
  - [x] 3.2: Combine with mock signature
  - [x] 3.3: Verify data field (ESDT transfer encoding) is preserved
  - [x] 3.4: Verify value="0" for ESDT (amount in data field)
  - [x] 3.5: Verify token identifier is preserved in data encoding

- [x] Task 4: Create staking transaction integration tests (AC: #3, #4)
  - [x] 4.1: Craft delegate transaction via API
  - [x] 4.2: Combine with mock signature
  - [x] 4.3: Verify staking data field is preserved
  - [x] 4.4: Verify value field contains delegation amount
  - [x] 4.5: Verify receiver is validator contract address

- [x] Task 5: Verify combined transaction is broadcast-compatible (AC: #1, #4)
  - [x] 5.1: Test that combine output passes broadcast validation checks
  - [x] 5.2: Test combined transaction format matches broadcast expectations
  - [x] 5.3: Document which validation errors come from format vs network

## Dev Notes

### Architecture Compliance

**ADR-005 (Test Structure):** All integration tests in single file `src/api/index.integ.test.ts`.

**FR30 Requirement:** `combine` method has integration tests with mock signatures.

**Test Strategy:**
- Use REAL `craftTransaction` API calls to get genuine unsigned transactions
- Use MOCK signatures (real signatures require hardware wallet)
- Verify transaction structure WITHOUT broadcasting (per technical notes)
- Tests should be deterministic and repeatable (NFR8)

### Technical Requirements

**Existing Combine Tests (Story 4.5):**

The following tests already exist in `index.integ.test.ts`:

```typescript
describe("combine (Story 4.5)", () => {
  it("combines transaction with valid signature (AC: #1, #2)")
  it("resulting transaction has signature field (AC: #2)")
  it("combined transaction can be parsed as valid JSON (AC: #1)")
  it("signature format is preserved as-is (AC: #2)")
  it("handles invalid signature without error per AC #3")
  it("throws error for malformed unsigned transaction")
  it("combine output is compatible with broadcast input format")
})
```

**Story 5.7 Enhancement Focus:**

The existing tests use **hardcoded** unsigned transactions. Story 5.7 requires testing with **real** transactions from `craftTransaction` API to verify the full integration:

1. **craftTransaction → combine chain:** Verify `craftTransaction` output works correctly with `combine`
2. **Native EGLD:** Full flow from intent to signed transaction
3. **ESDT tokens:** Verify token data encoding preserved through combination
4. **Staking:** Verify delegation data preserved through combination

### Mock Signature Constants

```typescript
// Use these mock signatures for tests (per technical notes)
const MOCK_SIGNATURES = {
  // 64-byte (128-char hex) signature matching MultiversX format
  standard: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" +
            "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  // Alternative for variety in tests
  alternate: "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5" +
             "d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3",
};
```

### Test Implementation Pattern

```typescript
describe("combine - integration tests (Story 5.7)", () => {
  const SENDER = TEST_ADDRESSES.withEgld;
  const RECIPIENT = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
  const MOCK_SIGNATURE = "a1b2c3..."; // 128 hex chars

  describe("craftTransaction → combine chain (AC: #1, #4)", () => {
    it("combines unsigned transaction from craftTransaction with mock signature", async () => {
      // Step 1: Craft real unsigned transaction
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" as const },
        sequence: 42n, // Explicit nonce to avoid network call
      };
      
      const { transaction: unsignedTx } = await api.craftTransaction(intent);
      
      // Step 2: Combine with mock signature
      const signedTx = api.combine(unsignedTx, MOCK_SIGNATURE);
      
      // Step 3: Verify result
      const parsed = JSON.parse(signedTx);
      expect(parsed.signature).toBe(MOCK_SIGNATURE);
      expect(parsed.nonce).toBe(42);
      expect(parsed.sender).toBe(SENDER);
      expect(parsed.receiver).toBe(RECIPIENT);
    });
  });
});
```

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- Jest for testing
- Existing `createApi()` factory
- Existing `craftTransaction` and `combine` methods
- Test addresses from `TEST_ADDRESSES` constant

### File Structure Requirements

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add Story 5.7 integration tests |

**No new files required** - tests go in existing integration test file per ADR-005.

### Test Address Strategy

Use existing test addresses from the integration test file:

```typescript
const TEST_ADDRESSES = {
  withTokens: "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
  withEgld: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
  zeroBalance: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
};
```

### Previous Story Intelligence

**From Story 4.5 (Combine Transaction with Signature):**

- `combine()` function is pure transformation: parses JSON → adds signature → returns JSON
- Runtime validation ensures parsed transaction matches `MultiversXProtocolTransaction` structure
- Malformed JSON throws: `"Invalid unsigned transaction: malformed JSON - {error}"`
- Missing fields throws: `"Invalid unsigned transaction: missing or invalid required fields"`
- Per AC #3, invalid signatures do NOT cause errors - validation at broadcast time

**From Story 4.1-4.3 (craftTransaction):**

- Native EGLD: returns transaction without `data` field
- ESDT tokens: returns transaction with `data` field containing `ESDTTransfer@{tokenHex}@{amountHex}`
- Staking: returns transaction with `data` field containing function name (e.g., `delegate`, `unDelegate@{amountHex}`)
- All transactions: `value` as string, addresses as bech32, gas parameters as numbers

**From Story 4.6 (Broadcast):**

- Broadcast validates:
  - `signature` field present and non-empty
  - Required fields present (nonce, sender, receiver, value, etc.)
  - Address format (bech32 `erd1...`)
- combine output must be broadcast-compatible

**Key Learnings:**

1. Always use explicit `sequence` in test intents to avoid network calls (deterministic tests)
2. ESDT transactions have `value="0"` - amount is in data field
3. Staking transactions have `receiver` as validator contract (starts with `erd1qqqqqqqqqqqqqqq`)
4. Signed transactions should pass broadcast validation (format only, not network submission)

### Git Intelligence Summary

**Recent Commits Analysis:**

- Integration tests follow pattern: beforeAll for API setup, describe blocks for method groups
- Tests use known mainnet addresses for deterministic results
- Timeout extended to 60-120 seconds for network calls
- Tests verify both happy path and error cases

**Code Patterns Established:**

- Tests grouped by story/feature in nested `describe` blocks
- Pre-fetch data in `beforeAll` when multiple tests need same data
- Explicit type annotations for TypeScript safety
- Comments reference acceptance criteria (AC: #1, etc.)

### Project Structure Notes

**Alignment with Unified Project Structure:**

- Integration tests in `src/api/index.integ.test.ts` (ADR-005 compliance)
- Test patterns match existing integration tests in same file
- Uses same `TEST_ADDRESSES` constants as other tests

**Test Naming Convention:**

Tests should clearly indicate:
- Story reference: "(Story 5.7)"
- Acceptance criteria: "(AC: #1, #2)"
- What is being tested

### Expected Test Output

Running `pnpm coin:multiversx test-integ` should show:

```
PASS src/api/index.integ.test.ts
  MultiversX API Integration Tests
    combine - integration tests (Story 5.7)
      craftTransaction → combine chain (AC: #1, #4)
        ✓ combines unsigned transaction from craftTransaction with mock signature
        ✓ combined result contains all original transaction fields
        ✓ combined result has signature field added
      native EGLD transactions (AC: #2)
        ✓ crafts and combines native EGLD transfer
        ✓ signed native transaction has correct structure
        ✓ native transaction has no data field
      ESDT token transactions (AC: #3)
        ✓ crafts and combines ESDT token transfer
        ✓ ESDT data field is preserved after combine
        ✓ ESDT value="0" preserved (amount in data)
      staking transactions (AC: #3, #4)
        ✓ crafts and combines delegate transaction
        ✓ staking data field is preserved after combine
        ✓ receiver is validator contract address
      broadcast compatibility (AC: #1, #4)
        ✓ combined transaction passes broadcast validation
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.7] - Original story definition and acceptance criteria
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts] - Existing integration tests (add to this file)
- [Source: libs/coin-modules/coin-multiversx/src/logic/combine.ts] - Combine function implementation
- [Source: libs/coin-modules/coin-multiversx/src/logic/combine.test.ts] - Combine unit tests (reference patterns)
- [Source: _bmad-output/implementation-artifacts/4-5-combine-transaction-with-signature.md] - Story 4.5 completion notes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

None - all tests passed on first run.

### Completion Notes List

- **Task 1 Complete:** Added 4 integration tests verifying the `craftTransaction` → `combine` chain works correctly with mock signatures. Tests verify unsigned transactions from the API can be combined, all fields are preserved, and the signature field is properly added.

- **Task 2 Complete:** Added 4 tests for native EGLD transactions. Tests verify: correct structure (MultiversXProtocolTransaction), no data field for native transfers, and that value/sender/receiver are preserved correctly after combining.

- **Task 3 Complete:** Added 4 tests for ESDT token transactions. Tests verify: data field (ESDTTransfer encoding) is preserved, value="0" (amount in data field), and token identifier is preserved in hex encoding.

- **Task 4 Complete:** Added 5 tests for staking transactions (delegate, unDelegate). Tests verify: staking data field is preserved, value field contains delegation amount, receiver is validator contract address (starts with `erd1qqq`), and unDelegate transaction preserves hex-encoded amount in data.

- **Task 5 Complete:** Added 4 tests for broadcast compatibility. Tests verify combined transactions pass broadcast validation checks (no format errors), correct typing for all fields, and both ESDT and staking transactions are broadcast-compatible.

- **All 21 Story 5.7 tests pass**
- **Full test suite: 134 passed, 1 skipped (intentionally), 0 failed**
- **No regressions introduced**

### Change Log

- 2026-02-04: Implemented Story 5.7 - Added 21 integration tests for combine method with real transactions from craftTransaction API
- 2026-02-04: Code review fixes applied - Added shared constants (LEDGER_VALIDATOR, ONE_EGLD), AC references to test names, explicit JSON validity assertions

### File List

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Added "combine - integration tests (Story 5.7)" describe block with 21 tests covering craftTransaction → combine chain, native EGLD, ESDT tokens, staking transactions, and broadcast compatibility |

## Senior Developer Review (AI)

### Review Date
2026-02-04

### Reviewer
Code Review Workflow (Adversarial)

### Review Outcome
**APPROVED with fixes applied**

### Issues Found and Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| MEDIUM | Duplicated `LEDGER_VALIDATOR` constant (lines 1107, 1990) | Moved to shared constants section at top of file |
| MEDIUM | Missing explicit test timeout for Story 5.7 | N/A - tests use explicit `sequence` avoiding network calls |
| LOW | Inconsistent AC references in test names | Added AC references to all test names |
| LOW | Magic numbers for EGLD amounts | Added `ONE_EGLD` constant and used throughout |
| LOW | Implicit JSON validity assertions | Added explicit `expect(() => JSON.parse(signedTx)).not.toThrow()` assertions |

### Verification Summary

| Acceptance Criteria | Status |
|---------------------|--------|
| AC #1: Unsigned → Combined | ✅ VERIFIED |
| AC #2: Native EGLD structure | ✅ VERIFIED |
| AC #3: ESDT token data preserved | ✅ VERIFIED |
| AC #4: Original data + signature | ✅ VERIFIED |

| Task | Tests | Status |
|------|-------|--------|
| Task 1: craftTransaction → combine chain | 4 | ✅ VERIFIED |
| Task 2: Native EGLD tests | 4 | ✅ VERIFIED |
| Task 3: ESDT token tests | 4 | ✅ VERIFIED |
| Task 4: Staking transaction tests | 5 | ✅ VERIFIED |
| Task 5: Broadcast compatibility | 4 | ✅ VERIFIED |
| **TOTAL** | **21** | ✅ MATCHES CLAIM |

### Code Quality Notes
- All 21 tests properly implement acceptance criteria
- Tests use real `craftTransaction` output (not hardcoded)
- Mock signatures are correctly formatted (128-char hex)
- Tests are deterministic (explicit `sequence` values)
- No regressions introduced
