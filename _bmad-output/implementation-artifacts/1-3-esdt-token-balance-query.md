# Story 1.3: ESDT Token Balance Query

Status: done

## Story

As a **Coin Module Developer**,
I want to retrieve all ESDT token balances for any MultiversX address,
so that I can display complete portfolio information including all tokens.

## Acceptance Criteria

1. **AC1: Multiple ESDT tokens** - Given a MultiversX address holding multiple ESDT tokens, when I call `api.getBalance(address)`, then I receive an array with native EGLD balance AND all ESDT token balances, and each ESDT balance has `asset.type === "esdt"` and `asset.assetReference` containing the token identifier

2. **AC2: Native only (no tokens)** - Given a MultiversX address with only native EGLD (no ESDT tokens), when I call `api.getBalance(address)`, then I receive only the native balance (no empty token entries)

3. **AC3: Zero EGLD with tokens** - Given a MultiversX address with ESDT tokens but zero EGLD, when I call `api.getBalance(address)`, then I receive the native balance as `0n` AND all ESDT token balances

## Tasks / Subtasks

- [x] Task 1: Add `mapToEsdtBalance` mapper function (AC: #1)
  - [x] Create mapper in `src/logic/mappers.ts`
  - [x] Map ESDT token to Balance with `asset.type='esdt'`
  - [x] Store token identifier in `assetReference`
  - [x] Store token name in `asset.name`

- [x] Task 2: Extend `getBalance` to fetch ESDT tokens (AC: #1, #2, #3)
  - [x] Import `mapToEsdtBalance` mapper
  - [x] Call `api.getESDTTokensForAddress(address)` after native balance
  - [x] Map each ESDT token to Balance and append to array
  - [x] Ensure native balance is always first

- [x] Task 3: Unit tests for ESDT scenarios (AC: #1, #2, #3)
  - [x] Test multiple ESDT tokens returns all token balances
  - [x] Test no ESDT tokens returns only native balance
  - [x] Test zero EGLD with tokens returns native as 0n plus tokens
  - [x] Test token identifier mapped to assetReference
  - [x] Test mapper unit tests

- [x] Task 4: Integration tests against mainnet (AC: #1, #2, #3)
  - [x] Create `jest.integ.config.js` for network-enabled tests
  - [x] Add `test-integ` script to package.json
  - [x] Test real address with ESDT tokens
  - [x] Verify ESDT token structure matches expected format

- [x] Task 5: Export new mapper function
  - [x] Export `mapToEsdtBalance` from `src/logic/index.ts`

## Dev Notes

### Architecture Decisions Applied
- **ADR-004 (Token Handling):** Unified ESDT token handling with single code flow using `asset.type` discrimination
- **Asset Type:** Use `"esdt"` for MultiversX tokens (per coin-framework types)
- **Asset Reference:** Store token identifier (e.g., `"USDC-c76f1f"`) in `assetReference`

### Critical Implementation Details
- Native balance MUST always be first in the array (consistency with other coin modules)
- Never return empty array - always return at least the native balance (FR4 compliance)
- Use `BigInt()` for string-to-bigint conversion of balance values
- Token identifier format: `TOKEN-abc123` (example: `USDC-c76f1f`)

### Project Structure Notes

- Logic function extended in `src/logic/getBalance.ts`
- Mapper added in `src/logic/mappers.ts`
- Tests next to source files following `*.test.ts` pattern
- Integration tests in `src/api/index.integ.test.ts` (single file per ADR-005)
- New `jest.integ.config.js` created for integration tests with network access

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md#Task 5]
- [Source: libs/coin-modules/coin-filecoin/src/logic/getBalance.ts] - Reference implementation
- [Source: libs/coin-framework/src/api/types.ts#AssetInfo] - Type definitions
- [Source: libs/coin-modules/coin-algorand/jest.integ.config.js] - Integration test config reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

- Extended `getBalance.ts` to fetch ESDT tokens using existing `api.getESDTTokensForAddress()`
- Created `mapToEsdtBalance` mapper function following ADR-004 token handling pattern
- Added comprehensive unit tests (40 tests total, all passing)
- Created integration test infrastructure with `jest.integ.config.js` and `test-integ` script
- Integration tests pass against real MultiversX mainnet (6 tests)
- Updated `jest.config.js` to exclude `.integ.test.ts` from unit test runs

### File List

**Modified:**
- `libs/coin-modules/coin-multiversx/src/api/index.ts`
- `libs/coin-modules/coin-multiversx/package.json`
- `libs/coin-modules/coin-multiversx/jest.config.js`

**Created:**
- `libs/coin-modules/coin-multiversx/src/logic/getBalance.ts`
- `libs/coin-modules/coin-multiversx/src/logic/getBalance.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/mappers.ts`
- `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/index.ts`
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts`
- `libs/coin-modules/coin-multiversx/src/api/index.test.ts`
- `libs/coin-modules/coin-multiversx/src/api/types.ts`
- `libs/coin-modules/coin-multiversx/src/index.ts`
- `libs/coin-modules/coin-multiversx/jest.integ.config.js`

## Senior Developer Review (AI)

**Reviewed:** 2026-01-30
**Reviewer:** Claude Opus 4.5 (Code Review Workflow)
**Outcome:** ✅ APPROVED (after fixes)

### Review Summary

All 3 Acceptance Criteria verified as implemented. 40 unit tests + 6 integration tests passing.

### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| M1 | MEDIUM | File List incorrectly marked `src/logic/` files as "Modified" instead of "Created" | ✅ Fixed - Updated File List |
| M2 | MEDIUM | 3 files created but not documented (`types.ts`, `index.test.ts`, `src/index.ts`) | ✅ Fixed - Added to File List |
| M3 | MEDIUM | Obsolete snapshot file causing exit code 1 | ✅ Fixed - Deleted obsolete snapshot |
| M4 | MEDIUM | Mock setup pattern used real constructor | ✅ Fixed - Refactored to factory function |
| L1 | LOW | Internal story references in code comments | ✅ Fixed - Removed story numbers |
| L2 | LOW | ESDT token regex too strict | ✅ Fixed - Loosened pattern |
| L4 | LOW | JSDoc contained story reference | ✅ Fixed - Removed reference |

### Test Results Post-Fix

- **Unit Tests:** 40 passed, 7 suites ✅
- **Integration Tests:** 6 passed, exit code 0 ✅

### Change Log Entry

```
2026-01-30 | Code Review | Fixed 4 MEDIUM + 3 LOW issues, updated File List documentation, cleaned obsolete snapshot
```
