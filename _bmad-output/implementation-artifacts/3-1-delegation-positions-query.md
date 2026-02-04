# Story 3.1: Delegation Positions Query

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to retrieve all delegation positions (stakes) for any MultiversX address,
So that I can display the user's staking portfolio.

## Acceptance Criteria

1. **Given** a MultiversX address with active delegations
   **When** I call `api.getStakes(address)`
   **Then** I receive a `Page<Stake>` object with delegation details (amount, validator, state)

2. **Given** a MultiversX address with multiple delegations to different validators
   **When** I call `api.getStakes(address)`
   **Then** I receive all delegation positions in the `items` array

3. **Given** a MultiversX address with no delegations
   **When** I call `api.getStakes(address)`
   **Then** I receive `{ items: [], next: undefined }`

4. **Given** an invalid MultiversX address
   **When** I call `api.getStakes(address)`
   **Then** an error is thrown with a descriptive message

## Tasks / Subtasks

- [x] Task 1: Create `mapToStake()` function in mappers.ts (AC: #1, #2)
  - [x] 1.1: Add `mapToStake(delegation: MultiversXDelegation, address: string): Stake` to `src/logic/mappers.ts`
  - [x] 1.2: Map `delegation.contract` → `Stake.delegate` (validator address)
  - [x] 1.3: Map `delegation.userActiveStake` → `Stake.amountDeposited` (as bigint)
  - [x] 1.4: Map `delegation.claimableRewards` → `Stake.amountRewarded` (as bigint)
  - [x] 1.5: Calculate total amount: `amountDeposited + amountRewarded + undelegating amounts`
  - [x] 1.6: Generate unique id: `{address}-{contract}` format
  - [x] 1.7: Set `asset: { type: "native" }` (EGLD is the staking asset)

- [x] Task 2: Implement delegation state mapping (AC: #1)
  - [x] 2.1: Create `DELEGATION_STATE_MAP` constant or helper function in mappers.ts
  - [x] 2.2: Map to "active" when `userActiveStake > 0` and no pending undelegations
  - [x] 2.3: Map to "deactivating" when `userUndelegatedList.length > 0` (has pending unbonding)
  - [x] 2.4: Map to "inactive" when no active stake and no pending undelegations (withdrawable only)
  - [x] 2.5: Note: "activating" state not directly detectable from delegation API (new stakes activate immediately after epoch)

- [x] Task 3: Create `getStakes()` logic function (AC: #1, #2, #3)
  - [x] 3.1: Create `src/logic/getStakes.ts` file
  - [x] 3.2: Import `mapToStake` from mappers and `isValidAddress` from logic
  - [x] 3.3: Validate address format, throw error if invalid (AC: #4)
  - [x] 3.4: Call `apiClient.getAccountDelegations(address)` to fetch delegations
  - [x] 3.5: Map each delegation using `mapToStake()`
  - [x] 3.6: Return `{ items: stakes, next: undefined }` (no pagination from API)
  - [x] 3.7: Handle empty delegations array → return `{ items: [], next: undefined }`

- [x] Task 4: Update API layer to use getStakes (AC: #1, #2, #3, #4)
  - [x] 4.1: Import `getStakes` in `src/api/index.ts`
  - [x] 4.2: Replace placeholder `getStakes` implementation with actual call
  - [x] 4.3: Add JSDoc documentation to the method

- [x] Task 5: Update logic/index.ts exports (AC: #1)
  - [x] 5.1: Export `getStakes` from logic/index.ts
  - [x] 5.2: Export `mapToStake` from mappers.ts

- [x] Task 6: Create unit tests for mapToStake (AC: #1, #2)
  - [x] 6.1: Create or extend `src/logic/mappers.test.ts` with stake mapping tests
  - [x] 6.2: Test: Maps active delegation to "active" state
  - [x] 6.3: Test: Maps delegation with undelegatedList to "deactivating" state
  - [x] 6.4: Test: Maps delegation with only withdrawable balance to "inactive" state
  - [x] 6.5: Test: Correctly calculates total amount including rewards and undelegating
  - [x] 6.6: Test: Generates correct unique id format
  - [x] 6.7: Test: Handles delegation with claimableRewards = "0"
  - [x] 6.8: Test: Handles delegation with empty userUndelegatedList

- [x] Task 7: Create unit tests for getStakes (AC: #1, #2, #3, #4)
  - [x] 7.1: Create `src/logic/getStakes.test.ts`
  - [x] 7.2: Test: Returns Page with stakes for address with delegations
  - [x] 7.3: Test: Returns Page with multiple stakes for multi-validator address
  - [x] 7.4: Test: Returns empty items array for address with no delegations
  - [x] 7.5: Test: Throws error for invalid address format
  - [x] 7.6: Test: Correctly propagates API errors

- [x] Task 8: Create integration tests for getStakes (AC: #1, #2, #3)
  - [x] 8.1: Add tests to `src/api/index.integ.test.ts`
  - [x] 8.2: Test: Returns stakes for known mainnet address with delegations
  - [x] 8.3: Test: Returns empty for address with no delegations
  - [x] 8.4: Test: Each stake has required fields (uid, address, delegate, state, asset, amount)
  - [x] 8.5: Test: State is one of: "active", "deactivating", "inactive"

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Create `mapToStake()` mapper function in `src/logic/mappers.ts`. Must be a pure function with no side effects.

**ADR-002 (State Mapping):** Use helper function or inline logic for delegation state mapping. MultiversX delegation states map as follows:
- `userActiveStake > 0` → "active"
- `userUndelegatedList.length > 0` → "deactivating"  
- Otherwise → "inactive"

**ADR-003 (Error Handling):** Throw `Error` with descriptive message for invalid addresses: `"Invalid MultiversX address: {address}"`.

**ADR-004 (Token Handling):** Not directly applicable - staking is always in EGLD (native asset).

**ADR-005 (Test Structure):** Add integration tests to existing `src/api/index.integ.test.ts`.

### Technical Requirements

**MultiversX Delegation Data Structure:**

From `src/types.ts`:

```typescript
export type MultiversXDelegation = {
  address: string;           // User's address
  contract: string;          // Validator contract address
  userUnBondable: string;    // Amount that can be withdrawn (string)
  userActiveStake: string;   // Active staked amount (string)
  claimableRewards: string;  // Claimable rewards (string)
  userUndelegatedList: UserUndelegated[];  // Pending undelegations
};

export type UserUndelegated = {
  amount: string;   // Undelegating amount (string)
  seconds: number;  // Seconds until withdrawable
};
```

**Alpaca API Stake Type:**

From `@ledgerhq/coin-framework/api/types`:

```typescript
export type Stake = {
  uid: string;              // Unique id: "{address}-{contract}"
  address: string;          // Owner account address
  delegate?: string;        // Validator/staking pool address
  state: StakeState;        // "inactive" | "activating" | "active" | "deactivating"
  stateUpdatedAt?: Date;    // Optional: UTC date of last state change
  createdAt?: Date;         // Optional: UTC date of initial stake creation
  asset: AssetInfo;         // { type: "native" } for EGLD
  amount: bigint;           // Total value (activeStake + rewards + undelegating)
  amountDeposited?: bigint; // Active staked amount
  amountRewarded?: bigint;  // Claimable rewards
  details?: object;         // Optional chain-specific details
};
```

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- `@ledgerhq/coin-framework/api/types` for `Stake`, `StakeState`, `Page` types
- Existing `apiCalls.ts` method: `getAccountDelegations(addr)` 
- Address validation from `logic.ts`: `isValidAddress()`

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/getStakes.ts` | Logic function to fetch and map delegations |
| `libs/coin-modules/coin-multiversx/src/logic/getStakes.test.ts` | Unit tests for getStakes |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/mappers.ts` | Add `mapToStake()` function |
| `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts` | Add `mapToStake()` unit tests |
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export `getStakes` and `mapToStake` |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Wire `getStakes` to API |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add integration tests |

### Existing Code to Leverage

**`apiCalls.ts` - getAccountDelegations():**

```typescript
async getAccountDelegations(addr: string): Promise<MultiversXDelegation[]> {
  const { data: delegations } = await network<MultiversXDelegation[]>({
    method: "GET",
    url: `${this.DELEGATION_API_URL}/accounts/${addr}/delegations`,
  });
  return delegations;
}
```

**`logic.ts` - isValidAddress():**

```typescript
export const isValidAddress = (address: string): boolean => {
  try {
    Address.newFromBech32(address);
    return true;
  } catch {
    return false;
  }
};
```

**Existing mapper patterns from `mappers.ts`:**

```typescript
// Follow this pattern for mapToStake
export function mapToBalance(balance: string): Balance {
  return {
    value: BigInt(balance),
    asset: { type: "native" },
  };
}
```

### Import Pattern

Follow existing pattern from other logic files:

```typescript
// External (coin-framework types)
import type { Page, Stake, StakeState } from "@ledgerhq/coin-framework/api/types";

// Internal modules
import MultiversXApi from "../api/apiCalls";
import { isValidAddress } from "../logic";
import { mapToStake } from "./mappers";

// Types
import type { MultiversXDelegation } from "../types";
```

### State Mapping Logic

```typescript
/**
 * Determines the StakeState for a MultiversX delegation.
 * @param delegation - Raw delegation data from API
 * @returns StakeState: "active", "deactivating", or "inactive"
 */
function getDelegationState(delegation: MultiversXDelegation): StakeState {
  // Has pending unbonding - deactivating takes priority
  if (delegation.userUndelegatedList && delegation.userUndelegatedList.length > 0) {
    return "deactivating";
  }
  
  // Has active stake
  if (BigInt(delegation.userActiveStake) > 0n) {
    return "active";
  }
  
  // No active stake, no unbonding - could be fully withdrawn or withdrawable
  return "inactive";
}
```

**Note:** "activating" state is not directly detectable because MultiversX delegations activate within the same epoch. New delegations appear immediately with `userActiveStake > 0`.

### Testing Requirements

**Unit Tests (`src/logic/mappers.test.ts`):**

```typescript
describe("mapToStake", () => {
  const TEST_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const VALIDATOR_CONTRACT = "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx";

  it("maps active delegation to Stake with 'active' state", () => {
    const delegation: MultiversXDelegation = {
      address: TEST_ADDRESS,
      contract: VALIDATOR_CONTRACT,
      userActiveStake: "1000000000000000000", // 1 EGLD
      claimableRewards: "50000000000000000",  // 0.05 EGLD
      userUnBondable: "0",
      userUndelegatedList: [],
    };

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.uid).toBe(`${TEST_ADDRESS}-${VALIDATOR_CONTRACT}`);
    expect(stake.address).toBe(TEST_ADDRESS);
    expect(stake.delegate).toBe(VALIDATOR_CONTRACT);
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amountDeposited).toBe(1000000000000000000n);
    expect(stake.amountRewarded).toBe(50000000000000000n);
  });

  it("maps delegation with userUndelegatedList to 'deactivating' state", () => {
    const delegation: MultiversXDelegation = {
      address: TEST_ADDRESS,
      contract: VALIDATOR_CONTRACT,
      userActiveStake: "500000000000000000",
      claimableRewards: "0",
      userUnBondable: "0",
      userUndelegatedList: [
        { amount: "500000000000000000", seconds: 86400 },
      ],
    };

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.state).toBe("deactivating");
    // Total should include undelegating amount
    expect(stake.amount).toBe(1000000000000000000n);
  });

  it("maps delegation with no active stake to 'inactive' state", () => {
    const delegation: MultiversXDelegation = {
      address: TEST_ADDRESS,
      contract: VALIDATOR_CONTRACT,
      userActiveStake: "0",
      claimableRewards: "0",
      userUnBondable: "1000000000000000000",
      userUndelegatedList: [],
    };

    const stake = mapToStake(delegation, TEST_ADDRESS);

    expect(stake.state).toBe("inactive");
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("getStakes", () => {
  // Use known mainnet address with delegations
  // TODO: Find/confirm address with active delegations on mainnet
  const ADDRESS_WITH_DELEGATIONS = "erd1..."; // TBD

  it("returns Page with stakes for address with delegations", async () => {
    const result = await api.getStakes(ADDRESS_WITH_DELEGATIONS);

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.next).toBeUndefined(); // No pagination
    
    if (result.items.length > 0) {
      const stake = result.items[0];
      expect(stake.uid).toBeDefined();
      expect(stake.address).toBe(ADDRESS_WITH_DELEGATIONS);
      expect(stake.delegate).toBeDefined();
      expect(["active", "deactivating", "inactive"]).toContain(stake.state);
      expect(stake.asset).toEqual({ type: "native" });
      expect(typeof stake.amount).toBe("bigint");
    }
  });

  it("returns empty items for address with no delegations", async () => {
    // Use known address without delegations
    const ADDRESS_NO_DELEGATIONS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
    
    const result = await api.getStakes(ADDRESS_NO_DELEGATIONS);

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });
});
```

**Test Addresses:**

| Purpose | Address | Notes |
|---------|---------|-------|
| Has delegations | TBD - Find on mainnet | Must have active delegation |
| No delegations | `erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th` | Known funded address without delegations |
| Empty account | Generate new or use known | For edge case testing |

### Project Structure Notes

**Alignment with Unified Project Structure:**

- New `logic/getStakes.ts` follows established pattern from `getBalance.ts` and `listOperations.ts`
- Unit tests co-located in same folder
- Integration tests in single `index.integ.test.ts` file (ADR-005)
- Mapper function in centralized `mappers.ts` file (ADR-001)

**Delegation API Endpoint:**

The delegation API uses a separate endpoint configured via:
- Environment variable: `MULTIVERSX_DELEGATION_API_ENDPOINT`
- Default fallback: Same as `MULTIVERSX_API_ENDPOINT`
- Production: `https://delegations-elrond.coin.ledger.com`

### Previous Story Intelligence

**From Epic 1 (getBalance, getSequence, lastBlock):**

- Established pattern for logic functions: validate address → call API → map response → return
- `isValidAddress()` already handles MultiversX bech32 address validation
- Error message format: `"Invalid MultiversX address: {address}"`

**From Story 2.1/2.2/2.3 (listOperations):**

- `mapToOperation()` provides template for mapper function patterns
- BigInt conversion from string amounts is common pattern
- Test mocking pattern using `jest.fn().mockResolvedValue()`

**Key Learnings:**

1. Always validate address before API call
2. Return consistent error messages
3. Map string amounts to bigint using `BigInt()` 
4. Asset type for native is `{ type: "native" }`
5. Use existing `apiCalls.ts` methods - already tested and working

### Git Intelligence Summary

**Recent Commits Analysis:**

- coin-filecoin and coin-algorand Alpaca API implementations provide reference patterns
- Mapper functions follow consistent naming: `mapTo{TargetType}`
- Logic functions follow pattern: validate → fetch → map → return

**Code Patterns Established:**

- Pure mapper functions in `logic/mappers.ts`
- Logic functions in separate files (e.g., `getBalance.ts`, `listOperations.ts`)
- Comprehensive unit tests with mocked API client
- Integration tests against real mainnet

### Latest Tech Information

**MultiversX Staking Properties:**

- Delegations are to staking providers (smart contracts), not validators directly
- Undelegation period: 10 epochs (~10 days on mainnet)
- Rewards can be claimed or re-delegated
- Minimum delegation: 1 EGLD (defined in `constants.ts` as `MIN_DELEGATION_AMOUNT`)

**API Response Example:**

```json
[
  {
    "address": "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    "contract": "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx",
    "userUnBondable": "0",
    "userActiveStake": "1000000000000000000",
    "claimableRewards": "50000000000000000",
    "userUndelegatedList": []
  }
]
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] - Original story definition and acceptance criteria
- [Source: _bmad-output/project-context.md] - Project context and implementation rules
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md] - Technical specification
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts#getAccountDelegations] - Existing delegation fetch method
- [Source: libs/coin-modules/coin-multiversx/src/types.ts#MultiversXDelegation] - Delegation type definition
- [Source: libs/coin-framework/src/api/types.ts#Stake] - Target Stake type from framework

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- All unit tests pass (57 tests after code review fixes)
- All integration tests pass (10 getStakes tests after code review additions)
- No code linting errors

### Completion Notes List

- **Task 1-2:** Implemented `mapToStake()` function in `mappers.ts` with `getDelegationState()` helper function. The mapper correctly transforms MultiversX delegation data to the Alpaca API `Stake` type with proper state mapping (active/deactivating/inactive).

- **Task 3:** Created `getStakes.ts` logic function that validates addresses, fetches delegations via the API client, and maps them to Stake objects. Returns a Page structure with no pagination (delegation API doesn't paginate).

- **Task 4-5:** Wired the `getStakes` function to the API layer and exported all new functions from the logic module.

- **Task 6-7-8:** Created comprehensive unit tests (13 for mapToStake, 7 for getStakes) and integration tests (10 tests) covering all acceptance criteria including happy paths, edge cases, and error conditions.

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/getStakes.ts`
- `libs/coin-modules/coin-multiversx/src/logic/getStakes.test.ts`

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/logic/mappers.ts` (added `mapToStake()` and `getDelegationState()`)
- `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts` (added 13 mapToStake tests)
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` (added exports)
- `libs/coin-modules/coin-multiversx/src/api/index.ts` (wired getStakes with cursor param)
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` (added 10 integration tests)

### Change Log

- 2026-01-30: Implemented Story 3.1 - Delegation Positions Query. Added `mapToStake()` mapper function with state logic, `getStakes()` logic function, API wiring, and comprehensive test coverage.
- 2026-01-30: **Code Review Fixes Applied:**
  - Fixed `mapToStake` to include `userUnBondable` in total amount calculation
  - Added `cursor` parameter to API `getStakes` method for interface compliance
  - Added try-catch error wrapping to `getStakes` logic function (consistent with other logic functions)
  - Added 3 new unit tests for `userUnBondable` handling
  - Added integration test for error wrapping
  - Enhanced integration test to validate positive stake case with multiple addresses

## Senior Developer Review (AI)

**Review Date:** 2026-01-30
**Reviewer:** Claude Opus 4.5 (Code Review Agent)
**Outcome:** Changes Requested → Fixed

### Issues Found: 7 (3 High, 3 Medium, 1 Low)

### Action Items

- [x] [HIGH] Include `userUnBondable` in total amount calculation in `mapToStake`
- [x] [HIGH] Add `cursor` parameter to API method signature for interface compliance
- [x] [HIGH] Fix Task 8.2 - add proper positive case validation in integration tests
- [x] [MEDIUM] Add try-catch error wrapping to `getStakes` logic function
- [x] [MEDIUM] Add integration test for network error wrapping
- [ ] [MEDIUM] Move `getDelegationState` to separate `stateMapping.ts` file per project context (deferred - minor)
- [x] [LOW] Add unit tests for edge cases (`userUnBondable` undefined, combined amounts)

**Resolution:** All HIGH and MEDIUM issues fixed except architecture location preference (deferred as minor). Story ready for final review.
