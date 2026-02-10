# Story 5.8: Bridge Regression Tests

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **QA/Test Engineer**,
I want existing bridge tests to continue passing,
So that I can confirm the API addition doesn't break existing functionality.

## Acceptance Criteria

1. **Given** all existing bridge unit tests
   **When** test suite runs
   **Then** all tests pass with no failures

2. **Given** all existing bridge integration tests (if any)
   **When** test suite runs
   **Then** all tests pass with no failures

3. **Given** the bridge implementation
   **When** API is added
   **Then** bridge code remains unchanged (API is additive)

4. **Given** bridge exports from package
   **When** checked
   **Then** all existing exports still work

## Tasks / Subtasks

- [ ] Task 1: Verify existing unit tests pass (AC: #1)
  - [ ] Run `pnpm coin:multiversx test` and verify all tests pass
  - [ ] Document test count and results in completion notes
  - [ ] Ensure no test regressions from previous runs

- [ ] Task 2: Verify existing integration tests pass (AC: #2)
  - [ ] Run `pnpm coin:multiversx test-integ` and verify all tests pass
  - [ ] Document integration test results in completion notes
  - [ ] Note: Integration tests run against live MultiversX mainnet

- [ ] Task 3: Verify bridge code unchanged (AC: #3)
  - [ ] Check `src/bridge/js.ts` has no modifications from API work
  - [ ] Verify bridge dependencies (`broadcast.ts`, `createTransaction.ts`, etc.) are unchanged
  - [ ] Confirm API implementation is purely additive

- [ ] Task 4: Verify package exports (AC: #4)
  - [ ] Check `src/index.ts` exports both `createBridges` and `createApi`
  - [ ] Verify package.json exports configuration is correct
  - [ ] Test import statement: `import { createBridges } from "@ledgerhq/coin-multiversx"`
  - [ ] Test import statement: `import { createApi } from "@ledgerhq/coin-multiversx/api"`

- [ ] Task 5: Verify lint and typecheck pass (AC: #1, #2, #3, #4)
  - [ ] Run `pnpm coin:multiversx lint` and verify no errors
  - [ ] Run `pnpm coin:multiversx typecheck` (if available) and verify no errors
  - [ ] Ensure code quality standards are maintained

- [ ] Task 6: Document regression test results (AC: #1, #2)
  - [ ] Create summary of all test results
  - [ ] Document any warnings or non-critical issues
  - [ ] Confirm no regressions detected

## Dev Notes

### Bridge Architecture (Must Remain Unchanged)

The bridge implementation at `src/bridge/js.ts` provides two main exports:

```typescript
// Currency Bridge - Account scanning
export function buildCurrencyBridge(signerContext): CurrencyBridge {
  // getPreloadStrategy, preload, hydrate, scanAccounts
}

// Account Bridge - Transaction lifecycle
export function buildAccountBridge(signerContext): AccountBridge {
  // estimateMaxSpendable, createTransaction, updateTransaction,
  // getTransactionStatus, prepareTransaction, sync, receive,
  // signOperation, broadcast, etc.
}

// Combined export
export function createBridges(signerContext) {
  return { currencyBridge, accountBridge };
}
```

### Existing Unit Tests to Verify

| Test File | Description | Expected Tests |
|-----------|-------------|----------------|
| `buildTransaction.unit.test.ts` | Transaction serialization | 2 tests |
| `buildOptimisticOperation.test.ts` | Optimistic operation building | 3 tests |
| `validateAddress.test.ts` | Address validation | 2 tests |
| `api/apiCalls.test.ts` | API network calls | Multiple tests |
| `logic/*.test.ts` | Logic function unit tests | 50+ tests |

### Test Commands

```bash
# Unit tests (excludes .integ.test.ts files)
pnpm coin:multiversx test

# Integration tests (runs .integ.test.ts files against mainnet)
pnpm coin:multiversx test-integ

# Coverage report
pnpm coin:multiversx coverage

# Linting
pnpm coin:multiversx lint
```

### Package Exports Verification

The `package.json` exports configuration should include:

```json
{
  "exports": {
    "./api": {
      "require": "./lib/api/index.js",
      "default": "./lib-es/api/index.js"
    },
    ".": {
      "require": "./lib/index.js",
      "default": "./lib-es/index.js"
    }
  }
}
```

The `src/index.ts` should export both:

```typescript
// Bridge exports (existing functionality)
export { createBridges } from "./bridge/js";

// Alpaca API exports (new, additive)
export { createApi } from "./api";
export type { MultiversXApi, MultiversXApiConfig } from "./api/types";
```

### Bridge Files (Must Remain Unchanged)

| File | Purpose | Change Expected |
|------|---------|-----------------|
| `src/bridge/js.ts` | Bridge factory functions | ❌ No changes |
| `src/broadcast.ts` | Transaction broadcasting | ❌ No changes |
| `src/createTransaction.ts` | Transaction creation | ❌ No changes |
| `src/buildTransaction.ts` | Transaction building | ❌ No changes |
| `src/getTransactionStatus.ts` | Transaction status | ❌ No changes |
| `src/signOperation.ts` | Sign operation | ❌ No changes |
| `src/synchronisation.ts` | Account sync | ❌ No changes |
| `src/prepareTransaction.ts` | Transaction prep | ❌ No changes |
| `src/estimateMaxSpendable.ts` | Max spendable calc | ❌ No changes |

### Verification Checklist

- [ ] All 50+ unit tests pass (including logic/ tests)
- [ ] All integration tests pass against mainnet
- [ ] Bridge code files unchanged (no modifications)
- [ ] Package exports work for both bridge and API
- [ ] Linting passes with no errors
- [ ] No TypeScript compilation errors

### Project Structure Notes

- **Test configuration**: `jest.config.js` (unit), `jest.integ.config.js` (integration)
- **Package location**: `libs/coin-modules/coin-multiversx/`
- **Bridge is purely additive**: API implementation does not modify bridge code

### Expected Test Results

Based on current codebase analysis:

**Unit Tests (`pnpm test`):**
- `buildTransaction.unit.test.ts`: 2 tests
- `buildOptimisticOperation.test.ts`: 3 tests  
- `validateAddress.test.ts`: 2 tests
- `api/index.test.ts`: Unit tests for API
- `logic/*.test.ts`: 50+ logic function tests
- Total: 60+ unit tests expected to pass

**Integration Tests (`pnpm test-integ`):**
- `api/index.integ.test.ts`: Comprehensive API integration tests
- Tests run against real MultiversX mainnet
- ~100+ integration test cases

### References

- [Source: libs/coin-modules/coin-multiversx/src/bridge/js.ts] - Bridge implementation
- [Source: libs/coin-modules/coin-multiversx/src/index.ts] - Package exports
- [Source: libs/coin-modules/coin-multiversx/package.json] - Package configuration
- [Source: libs/coin-modules/coin-multiversx/jest.config.js] - Unit test config
- [Source: libs/coin-modules/coin-multiversx/jest.integ.config.js] - Integration test config
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.8] - Acceptance criteria (FR31)
- [Source: _bmad-output/planning-artifacts/architecture.md] - Architecture decisions
- [Source: _bmad-output/project-context.md] - Project rules and patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
