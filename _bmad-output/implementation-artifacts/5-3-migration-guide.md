# Story 5.3: Migration Guide

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want a migration guide for future maintainers,
So that others can understand how to migrate similar coins to the Alpaca API pattern.

## Acceptance Criteria

1. **Given** a developer assigned to migrate another coin module
   **When** they read the migration guide in README
   **Then** they understand the step-by-step process

2. **Given** the migration guide
   **When** it references the implementation
   **Then** it points to specific files and patterns used

3. **Given** common migration challenges
   **When** documented
   **Then** the guide explains how they were solved in coin-multiversx

4. **Given** reference implementations mentioned
   **When** a developer checks them
   **Then** coin-filecoin and other references are correctly cited

## Tasks / Subtasks

- [x] Task 1: Create Migration Guide section in README (AC: #1, #2, #3, #4)
  - [x] 1.1: Add "Migration Guide" heading to README.md
  - [x] 1.2: Document step-by-step migration process
  - [x] 1.3: Reference coin-filecoin as primary pattern
  - [x] 1.4: List files to create/modify during migration
  - [x] 1.5: Document folder structure requirements (api/, logic/, types/)

- [x] Task 2: Document Architecture Decisions (AC: #2, #3)
  - [x] 2.1: Document ADR-001 (Mapper functions in logic/ folder)
  - [x] 2.2: Document ADR-002 (State mapping with constant lookup)
  - [x] 2.3: Document ADR-003 (Error handling format)
  - [x] 2.4: Document ADR-004 (Token handling with asset.type discrimination)
  - [x] 2.5: Document ADR-005 (Integration tests in single file)

- [x] Task 3: Document Implementation Patterns (AC: #1, #2)
  - [x] 3.1: Document createApi() factory pattern
  - [x] 3.2: Document logic function patterns (pure functions, no side effects)
  - [x] 3.3: Document test patterns (unit tests co-located, integration in api/)
  - [x] 3.4: Document type naming conventions (MultiversX{TypeName} prefix)

- [x] Task 4: Document Common Challenges and Solutions (AC: #3)
  - [x] 4.1: Document empty account handling (return 0n, never empty array)
  - [x] 4.2: Document unsupported method handling (throw with specific message)
  - [x] 4.3: Document token/ESDT handling patterns
  - [x] 4.4: Document staking/delegation state mapping
  - [x] 4.5: Document network layer reuse vs logic layer separation

- [x] Task 5: Add Migration Checklist (AC: #1)
  - [x] 5.1: Create checklist for new coin migration
  - [x] 5.2: Include test coverage requirements
  - [x] 5.3: Include package.json export configuration
  - [x] 5.4: Include backward compatibility considerations

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Document the mapper function pattern (`mapTo{TargetType}`) and their placement in `src/logic/mappers.ts`. Explain that mappers are pure functions that transform chain-specific data to standardized Alpaca API types.

**ADR-002 (State Mapping):** Document the constant lookup pattern (`DELEGATION_STATE_MAP`) in `src/logic/stateMapping.ts`. Explain when to use direct mapping vs. computed state.

**ADR-003 (Error Handling):** Document the error message format: `"{methodName} is not supported"`. List all unsupported methods and their error handling.

**ADR-004 (Token Handling):** Document the unified code flow using `asset.type` discrimination. Explain the difference between `native`, `esdt`, and other asset types.

**ADR-005 (Test Structure):** Document that all integration tests belong in single file `src/api/index.integ.test.ts`.

### Technical Requirements

**Migration Guide Structure:**

The migration guide in README.md should follow this structure:

```markdown
## Migration Guide

This section documents how coin-multiversx was migrated to the Alpaca API pattern.
Use this as a reference when migrating other coin modules.

### Reference Implementation

Primary reference: `libs/coin-modules/coin-filecoin/src/api/`

### Step-by-Step Migration Process

1. **Create folder structure**
2. **Create type definitions**
3. **Implement logic functions**
4. **Create API layer with createApi()**
5. **Add unit tests**
6. **Add integration tests**
7. **Update package.json exports**

### Files to Create

| File | Purpose |
|------|---------|
| `src/api/index.ts` | createApi() factory |
| `src/api/types.ts` | API type definitions |
| `src/logic/index.ts` | Re-exports |
| `src/logic/mappers.ts` | Data transformation functions |
| `src/logic/{method}.ts` | Logic functions for each API method |

### Architecture Decisions

(Document all ADRs with rationale)

### Common Challenges

(Document challenges encountered and how they were solved)

### Migration Checklist

(Provide actionable checklist)
```

### Library & Framework Requirements

**No new dependencies required for documentation.**

This is a documentation-only story. The README update requires:
- Markdown formatting
- Code block examples
- Table formatting
- Correct file path references

### File Structure Requirements

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/README.md` | Add Migration Guide section |

**Note:** README.md may need to be created if it doesn't exist. Check if an existing README exists first.

### Existing Code to Leverage

**Implementation Reference Files:**

| File | Reference For |
|------|---------------|
| `src/api/index.ts` | createApi() factory pattern |
| `src/logic/index.ts` | Re-export pattern |
| `src/logic/mappers.ts` | Mapper function pattern |
| `src/logic/stateMapping.ts` | State mapping pattern |
| `src/logic/getBalance.ts` | Empty account handling |
| `src/logic/craftTransaction.ts` | Transaction crafting pattern |
| `src/api/index.integ.test.ts` | Integration test pattern |

**coin-filecoin Reference:**

| File | Pattern to Document |
|------|---------------------|
| `coin-filecoin/src/api/index.ts` | createApi() structure |
| `coin-filecoin/src/logic/` | Logic folder organization |
| `coin-filecoin/src/network/` | Network layer separation |

### Import Pattern

Not applicable - this is a documentation story with no code imports.

### Implementation Pattern

**Migration Guide Content Structure:**

```markdown
## Migration Guide

This section provides guidance for developers migrating other coin modules
to the Alpaca API pattern, using coin-multiversx as a reference implementation.

### Overview

The Alpaca API is a standardized interface (`Api<MemoType, TxDataType>`) that
enables coin modules to be used by the Alpaca backend service. This migration
adds the API layer while keeping the existing bridge implementation unchanged.

### Reference Implementations

| Module | Best For |
|--------|----------|
| `coin-filecoin` | Primary reference - clean implementation |
| `coin-multiversx` | ESDT tokens, delegation/staking, state mapping |

### Migration Steps

#### 1. Create Folder Structure

```
src/
├── api/
│   ├── index.ts        # createApi() factory
│   ├── index.test.ts   # Unit tests
│   ├── index.integ.test.ts  # Integration tests
│   └── types.ts        # API-specific types
├── logic/
│   ├── index.ts        # Re-exports
│   ├── mappers.ts      # Data transformation
│   ├── getBalance.ts   # Balance query
│   ├── listOperations.ts   # Operation history
│   └── ...             # Other API methods
└── types.ts            # Shared types (update existing)
```

#### 2. Implement Api Interface Methods

The `Api` interface requires 14 methods. Implement or throw "not supported":

| Method | Required | Notes |
|--------|----------|-------|
| `broadcast` | Yes | Submit signed transaction |
| `combine` | Yes | Add signature to unsigned tx |
| `craftTransaction` | Yes | Create unsigned transaction |
| `craftRawTransaction` | Usually No | Throw if not needed |
| `estimateFees` | Yes | Calculate transaction fees |
| `getBalance` | Yes | **Never return empty array** |
| `lastBlock` | Yes | Current block height |
| `listOperations` | Yes | Transaction history |
| `validateIntent` | Yes | Validate before signing |
| `getSequence` | Yes | Account nonce/sequence |
| `getBlock` | Usually No | Throw if not needed |
| `getBlockInfo` | Usually No | Throw if not needed |
| `getStakes` | If staking | Delegation positions |
| `getRewards` | Usually No | Historical rewards |
| `getValidators` | If staking | Validator list |

#### 3. Follow Architectural Decisions

**Mapper Functions (ADR-001):**
- Pattern: `mapTo{TargetType}(raw: ChainType): AlpacaType`
- Location: `src/logic/mappers.ts`
- Pure functions only

**State Mapping (ADR-002):**
- Use constant lookup objects for state mapping
- Location: `src/logic/stateMapping.ts`

**Error Handling (ADR-003):**
- Format: `throw new Error("{methodName} is not supported")`
- No custom error classes for unsupported methods

**Token Handling (ADR-004):**
- Use `asset.type` discrimination
- Single code flow for native + tokens

**Test Structure (ADR-005):**
- Unit tests: `*.test.ts` co-located with source
- Integration tests: Single `api/index.integ.test.ts` file

### Critical Implementation Details

#### Empty Account Handling

```typescript
// ✅ CORRECT - Always return at least native balance
getBalance: async (address) => {
  const balance = await fetchBalance(address);
  return [{
    value: BigInt(balance ?? 0),
    asset: { type: "native" }
  }];
}

// ❌ WRONG - Never return empty array
getBalance: async (address) => {
  const balance = await fetchBalance(address);
  if (balance === 0) return []; // WRONG!
}
```

#### Unsupported Method Pattern

```typescript
// ✅ CORRECT
getBlock: async (_height: number) => {
  throw new Error("getBlock is not supported");
}

// ❌ WRONG
getBlock: async () => {
  throw new Error("Not supported"); // Missing method name
}
```

### Migration Checklist

- [ ] Create `src/api/` folder structure
- [ ] Create `src/logic/` folder with index.ts
- [ ] Implement `createApi()` factory function
- [ ] Implement all 14 Api interface methods (or throw "not supported")
- [ ] Create mapper functions for data transformation
- [ ] Handle empty accounts (return 0n, not empty array)
- [ ] Create unit tests with 100% coverage for logic/
- [ ] Create integration tests in api/index.integ.test.ts
- [ ] Update package.json exports:
  ```json
  "exports": {
    "./api": { "require": "./lib/cjs/api/index.js", "default": "./lib/esm/api/index.js" },
    "./logic": { "require": "./lib/cjs/logic/index.js", "default": "./lib/esm/logic/index.js" }
  }
  ```
- [ ] Verify existing bridge tests still pass
- [ ] Add JSDoc to public API functions
- [ ] Update main index.ts to export createApi

### Common Challenges

#### Challenge: Existing network layer uses different data formats

**Solution:** Create mapper functions in `logic/mappers.ts` that transform
network layer responses to Alpaca API types. Keep network layer unchanged.

#### Challenge: Chain doesn't support certain operations (getBlock, getRewards)

**Solution:** Implement method but throw descriptive error:
```typescript
throw new Error("{methodName} is not supported");
```

#### Challenge: Token/asset handling varies by chain

**Solution:** Use unified `asset.type` discrimination pattern.
Map chain-specific token types to `"native"` or custom type (e.g., `"esdt"`, `"erc20"`).

#### Challenge: Staking state names differ from Alpaca StakeState enum

**Solution:** Create `DELEGATION_STATE_MAP` constant to map chain states
to Alpaca states: `inactive`, `activating`, `active`, `deactivating`.

### Testing Best Practices

1. **Use real mainnet for integration tests** (except broadcast)
2. **Use known addresses** with predictable data
3. **Test empty accounts** to verify proper 0n handling
4. **Test pagination** for listOperations
5. **Mock signatures** for combine tests
```

### Testing Requirements

**No unit tests required - this is a documentation story.**

**Validation Checklist:**
- [ ] README.md exists and is properly formatted
- [ ] Migration guide section is clearly titled
- [ ] Step-by-step process is complete
- [ ] All ADRs are documented with rationale
- [ ] File paths are correct and verifiable
- [ ] Code examples are valid TypeScript
- [ ] Migration checklist is actionable
- [ ] coin-filecoin reference is correctly cited

### Project Structure Notes

**Alignment with Unified Project Structure:**

- Documentation goes in module's README.md
- Reference implementation paths must be correct
- Code examples must match actual implementation

**Detected Conflicts or Variances:**

- None - documentation story doesn't modify code structure

### Previous Story Intelligence

**From Epic 1-4 Implementation:**

Key patterns established that should be documented:
1. `createApi()` factory returning `Api<MemoNotSupported, TxDataNotSupported>`
2. Logic functions as pure transformations in `src/logic/`
3. Mappers following `mapTo{Type}` naming convention
4. State mapping with constant lookup tables
5. Empty account handling (always return native balance with 0n)
6. Unsupported methods throw with format `"{methodName} is not supported"`
7. Integration tests against real mainnet (Ledger proxy)
8. Unit tests co-located with source files

**Lessons Learned:**

1. Always read existing network layer before implementing logic functions
2. Reuse existing SDK functions where possible
3. Keep bridge unchanged - API is purely additive
4. Document type parameters (`MemoNotSupported`, `TxDataNotSupported`) usage
5. Test with real addresses for predictable integration tests

### Git Intelligence Summary

**Implementation Files to Reference:**

From `git status`:
- `src/api/index.ts` - Complete createApi() implementation
- `src/logic/*.ts` - All logic functions implemented
- `src/api/index.integ.test.ts` - Integration test patterns
- `src/api/types.ts` - API type definitions

### Latest Tech Information

**Alpaca API Interface (from `@ledgerhq/coin-framework/api/types`):**

The Api interface is defined as:
```typescript
type Api<MemoType, TxDataType> = AlpacaApi<MemoType, TxDataType> & BridgeApi<MemoType, TxDataType>;
```

For MultiversX, use:
```typescript
type MultiversXApi = Api<MemoNotSupported, TxDataNotSupported>;
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] - Original story definition with acceptance criteria
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md] - Complete technical specification
- [Source: libs/coin-modules/coin-multiversx/src/api/index.ts] - createApi() implementation reference
- [Source: libs/coin-modules/coin-multiversx/src/logic/index.ts] - Logic module exports
- [Source: libs/coin-modules/coin-filecoin/src/api/index.ts] - Reference implementation
- [Source: libs/coin-framework/src/api/types.ts] - Api interface definition

## Senior Developer Review (AI)

**Review Date:** 2026-02-04
**Review Outcome:** Changes Requested → Fixed

### Action Items

- [x] [HIGH] Fix incorrect package.json export paths in Migration Checklist (lib/cjs → lib, lib/esm → lib-es)
- [x] [HIGH] Remove false ./logic export claim from checklist
- [x] [HIGH] Add missing logic files to Files Reference (getSequence.ts, getValidators.ts)
- [x] [HIGH] Complete folder structure diagram with all 12 logic files
- [x] [MEDIUM] Clarify listOperations return type in usage example
- [x] [MEDIUM] Add MemoType/TxDataType usage explanation
- [x] [MEDIUM] Document signerContext parameter in Bridge API example

**Summary:** 4 High, 3 Medium issues identified and fixed. Documentation now accurately reflects actual implementation.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Documentation-only story with no tests required.

### Completion Notes List

- Created comprehensive README.md for coin-multiversx with full migration guide
- Documented step-by-step migration process (7 steps) with code examples
- Referenced coin-filecoin as primary implementation pattern
- Documented all 5 Architecture Decision Records (ADRs):
  - ADR-001: Mapper functions in logic/ folder with `mapTo{TargetType}` naming
  - ADR-002: State mapping with constant lookup tables
  - ADR-003: Error handling format `"{methodName} is not supported"`
  - ADR-004: Token handling with asset.type discrimination
  - ADR-005: Integration tests in single file
- Documented all 14 Api interface methods with implementation requirements
- Added Common Challenges and Solutions section covering:
  - Empty account handling (return 0n, never empty array)
  - Unsupported method error handling
  - Token/ESDT handling patterns
  - Staking/delegation state mapping
  - Network layer reuse vs logic layer separation
- Created actionable Migration Checklist with 13 items
- Added Files Reference table with all logic files and their purposes
- Included development scripts and environment variable documentation
- All code examples use actual patterns from coin-multiversx implementation

### Change Log

- 2026-02-04: Created README.md with comprehensive Migration Guide section
- 2026-02-04: Code review fixes applied - corrected package.json export paths, completed folder structure, added missing files to reference table, clarified API usage examples

### File List

| Action | File |
|--------|------|
| Created | `libs/coin-modules/coin-multiversx/README.md` |
