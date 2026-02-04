# Story 3.2: Delegation State Mapping

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want delegation states mapped to the standardized `StakeState` enum,
So that I can handle staking states consistently across different blockchains.

## Acceptance Criteria

1. **Given** a delegation in "staked" state on MultiversX (userActiveStake > 0, no undelegating amounts)
   **When** the stake is mapped
   **Then** the `state` field is `"active"`

2. **Given** a delegation in "unstaking" state on MultiversX (userUndelegatedList has items with seconds > 0)
   **When** the stake is mapped
   **Then** the `state` field is `"deactivating"`

3. **Given** a delegation in "withdrawable" state on MultiversX (userUnBondable > 0 or userUndelegatedList has items with seconds === 0)
   **When** the stake is mapped
   **Then** the `state` field is `"inactive"`

4. **Given** a new delegation being activated
   **When** the stake is mapped
   **Then** the `state` field is `"active"` (MultiversX staking is immediate; `"activating"` is not used)

5. **Given** a delegation with both active stake and undelegating amounts
   **When** the stake is mapped
   **Then** the primary state reflects the most actionable status (typically `"deactivating"` takes precedence)

## Tasks / Subtasks

- [x] Task 1: Create stateMapping.ts with DELEGATION_STATE_MAP and mapDelegationState function (AC: #1, #2, #3, #4)
  - [x] 1.1: Create `src/logic/stateMapping.ts` file following ADR-002 pattern
  - [x] 1.2: Implement `mapDelegationState(delegation: MultiversXDelegation): StakeState` function
  - [x] 1.3: Handle "active" state: userActiveStake > 0 and no pending undelegations
  - [x] 1.4: Handle "deactivating" state: userUndelegatedList has items with seconds > 0
  - [x] 1.5: Handle "inactive" state: userUnBondable > 0 or undelegations complete (seconds === 0)
  - [x] 1.6: Handle edge case: delegation with 0 active stake and empty undelegated list → "inactive"
  - [x] 1.7: Export mapDelegationState from logic/index.ts

- [x] Task 2: Update mappers.ts with mapToStake function (AC: #1-5)
  - [x] 2.1: Create `mapToStake(delegation: MultiversXDelegation, address: string): Stake` function
  - [x] 2.2: Import and use `mapDelegationState()` for state determination
  - [x] 2.3: Map delegation amount: userActiveStake + claimableRewards + undelegated amounts
  - [x] 2.4: Map amountDeposited: userActiveStake
  - [x] 2.5: Map amountRewarded: claimableRewards
  - [x] 2.6: Include delegation details in `details` field (userUnBondable, userUndelegatedList)
  - [x] 2.7: Generate unique stake ID: `{address}-{contract}`

- [x] Task 3: Create unit tests for stateMapping.ts (AC: #1, #2, #3, #4)
  - [x] 3.1: Create `src/logic/stateMapping.test.ts` file
  - [x] 3.2: Test "active" state: delegation with only active stake
  - [x] 3.3: Test "deactivating" state: delegation with undelegating amounts (seconds > 0)
  - [x] 3.4: Test "inactive" state: delegation with withdrawable amounts (seconds === 0)
  - [x] 3.5: Test "inactive" state: delegation with userUnBondable > 0
  - [x] 3.6: Test edge case: empty delegation (all zeros) → "inactive"
  - [x] 3.7: Test mixed state: active stake AND undelegating → "deactivating" takes precedence
  - [x] 3.8: Test all undelegations complete → "inactive"

- [x] Task 4: Create unit tests for mapToStake in mappers.test.ts (AC: #1-5)
  - [x] 4.1: Add mapToStake tests to existing `src/logic/mappers.test.ts`
  - [x] 4.2: Test mapping of active delegation to Stake object
  - [x] 4.3: Test amount calculation includes all components
  - [x] 4.4: Test correct asset type (native EGLD)
  - [x] 4.5: Test details field contains undelegation information
  - [x] 4.6: Test stake uid format: `{address}-{contract}`
  - [x] 4.7: Test multiple undelegated items are summed correctly

- [x] Task 5: Document state mapping convention in code comments (AC: #1-5)
  - [x] 5.1: Add JSDoc to mapDelegationState explaining MultiversX-specific logic
  - [x] 5.2: Document that MultiversX uses field analysis (not string state values)
  - [x] 5.3: Add comments explaining state precedence rules

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Create `mapToStake()` mapper function in `logic/mappers.ts` following established naming pattern.

**ADR-002 (State Mapping):** Create `src/logic/stateMapping.ts` with state mapping logic. Note: MultiversX uses field-based state determination, not string state values. The DELEGATION_STATE_MAP constant serves as documentation; actual logic analyzes delegation fields.

**ADR-003 (Error Handling):** No new error handling required. State mapping uses pure functions with no failure modes.

**ADR-004 (Token Handling):** Staking is EGLD-only (native asset). All stakes have `asset: { type: "native" }`.

**ADR-005 (Test Structure):** Create `stateMapping.test.ts` for unit tests. Follow existing test patterns from `mappers.test.ts`.

### Technical Requirements

**MultiversX Delegation State Logic:**

MultiversX does NOT use explicit state strings. Instead, state is derived from delegation field values:

```typescript
type MultiversXDelegation = {
  address: string;          // User's address
  contract: string;         // Validator/provider contract address
  userUnBondable: string;   // Amount ready to withdraw (unbonding complete)
  userActiveStake: string;  // Currently staked amount
  claimableRewards: string; // Pending rewards
  userUndelegatedList: UserUndelegated[];  // Pending undelegations
};

type UserUndelegated = {
  amount: string;   // Undelegating amount
  seconds: number;  // Seconds remaining until withdrawable (0 = ready)
};
```

**State Determination Algorithm:**

```typescript
import type { StakeState } from "@ledgerhq/coin-framework/api/types";

export function mapDelegationState(delegation: MultiversXDelegation): StakeState {
  const hasActiveStake = BigInt(delegation.userActiveStake) > 0n;
  const hasUnbondable = BigInt(delegation.userUnBondable) > 0n;
  const hasPendingUndelegations = delegation.userUndelegatedList.some(
    u => u.seconds > 0 && BigInt(u.amount) > 0n
  );
  const hasCompletedUndelegations = delegation.userUndelegatedList.some(
    u => u.seconds === 0 && BigInt(u.amount) > 0n
  );

  // Priority order:
  // 1. Deactivating: Has pending undelegations (waiting period)
  // 2. Inactive: Has withdrawable amounts OR no active stake
  // 3. Active: Has active stake
  
  if (hasPendingUndelegations) {
    return "deactivating";
  }
  
  if (hasUnbondable || hasCompletedUndelegations) {
    return "inactive";
  }
  
  if (hasActiveStake) {
    return "active";
  }
  
  // Default: No stake, no pending actions
  return "inactive";
}
```

**Note on "activating" State:**

MultiversX staking is immediate - there is no activation period. The `"activating"` state is not used for MultiversX delegations. If a future MultiversX protocol update introduces an activation period, this can be added.

**mapToStake Implementation:**

```typescript
import type { Stake } from "@ledgerhq/coin-framework/api/types";
import { mapDelegationState } from "./stateMapping";
import type { MultiversXDelegation } from "../types";

export function mapToStake(delegation: MultiversXDelegation, address: string): Stake {
  const state = mapDelegationState(delegation);
  
  // Calculate total amount: active + rewards + all undelegating amounts
  const activeStake = BigInt(delegation.userActiveStake);
  const rewards = BigInt(delegation.claimableRewards);
  const unbondable = BigInt(delegation.userUnBondable);
  const undelegatingTotal = delegation.userUndelegatedList.reduce(
    (sum, u) => sum + BigInt(u.amount),
    0n
  );
  
  const totalAmount = activeStake + rewards + unbondable + undelegatingTotal;
  
  return {
    uid: `${address}-${delegation.contract}`,
    address: address,
    delegate: delegation.contract,
    state,
    asset: { type: "native" },
    amount: totalAmount,
    amountDeposited: activeStake,
    amountRewarded: rewards,
    details: {
      userUnBondable: delegation.userUnBondable,
      userUndelegatedList: delegation.userUndelegatedList,
    },
  };
}
```

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- `@ledgerhq/coin-framework/api/types` for `Stake`, `StakeState` types
- Native `BigInt` for amount calculations
- Existing `MultiversXDelegation` type from `../types`

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/stateMapping.ts` | State mapping function and constants |
| `libs/coin-modules/coin-multiversx/src/logic/stateMapping.test.ts` | Unit tests for state mapping |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/mappers.ts` | Add `mapToStake()` function |
| `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts` | Add mapToStake tests |
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export stateMapping functions |

### Existing Code to Leverage

**From `src/types.ts`:**

```typescript
// Already defined - use as-is
export type MultiversXDelegation = {
  address: string;
  contract: string;
  userUnBondable: string;
  userActiveStake: string;
  claimableRewards: string;
  userUndelegatedList: UserUndelegated[];
};

export type UserUndelegated = {
  amount: string;
  seconds: number;
};
```

**From `src/logic.ts` (existing helper):**

```typescript
// Reference for balance calculation pattern
export const computeDelegationBalance = (delegations: MultiversXDelegation[]): BigNumber => {
  let totalDelegationBalance = new BigNumber(0);
  for (const delegation of delegations) {
    let delegationBalance = new BigNumber(delegation.userActiveStake).plus(
      new BigNumber(delegation.claimableRewards),
    );
    for (const undelegation of delegation.userUndelegatedList) {
      delegationBalance = delegationBalance.plus(new BigNumber(undelegation.amount));
    }
    totalDelegationBalance = totalDelegationBalance.plus(delegationBalance);
  }
  return totalDelegationBalance;
};
```

**From `src/api/apiCalls.ts`:**

```typescript
// API method to fetch delegations
async getAccountDelegations(addr: string): Promise<MultiversXDelegation[]> {
  const { data: delegations } = await network<MultiversXDelegation[]>({
    method: "GET",
    url: `${this.DELEGATION_API_URL}/accounts/${addr}/delegations`,
  });
  return delegations;
}
```

### Import Pattern

Follow established import order (External → Internal → Types):

```typescript
// stateMapping.ts
import type { StakeState } from "@ledgerhq/coin-framework/api/types";

import type { MultiversXDelegation } from "../types";

// mappers.ts (additions)
import type { Balance, Operation, Stake } from "@ledgerhq/coin-framework/api/types";

import { mapDelegationState } from "./stateMapping";

import type { ESDTToken, MultiversXApiTransaction, MultiversXDelegation } from "../types";
```

### Testing Requirements

**Unit Tests (`src/logic/stateMapping.test.ts`):**

```typescript
import { mapDelegationState } from "./stateMapping";
import type { MultiversXDelegation } from "../types";

describe("mapDelegationState", () => {
  describe("active state", () => {
    it("returns 'active' when delegation has only active stake", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "1000000000000000000", // 1 EGLD
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [],
      };
      
      expect(mapDelegationState(delegation)).toBe("active");
    });

    it("returns 'active' when delegation has active stake and rewards", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "1000000000000000000",
        claimableRewards: "50000000000000000", // 0.05 EGLD rewards
        userUnBondable: "0",
        userUndelegatedList: [],
      };
      
      expect(mapDelegationState(delegation)).toBe("active");
    });
  });

  describe("deactivating state", () => {
    it("returns 'deactivating' when delegation has pending undelegations", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 86400 }, // 24 hours remaining
        ],
      };
      
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("returns 'deactivating' when has both active stake AND pending undelegations", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "1000000000000000000", // Still has active stake
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 3600 }, // Pending undelegation
        ],
      };
      
      // Deactivating takes precedence over active
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });
  });

  describe("inactive state", () => {
    it("returns 'inactive' when delegation has withdrawable amount (userUnBondable)", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "1000000000000000000", // Ready to withdraw
        userUndelegatedList: [],
      };
      
      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("returns 'inactive' when undelegations are complete (seconds === 0)", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [
          { amount: "500000000000000000", seconds: 0 }, // Complete
        ],
      };
      
      expect(mapDelegationState(delegation)).toBe("inactive");
    });

    it("returns 'inactive' when delegation is empty (all zeros)", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "0",
        userUndelegatedList: [],
      };
      
      expect(mapDelegationState(delegation)).toBe("inactive");
    });
  });

  describe("mixed states (precedence)", () => {
    it("deactivating takes precedence over inactive", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "500000000000000000", // Has withdrawable
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 3600 }, // Also has pending
        ],
      };
      
      // Pending undelegation takes precedence
      expect(mapDelegationState(delegation)).toBe("deactivating");
    });

    it("inactive when all undelegations complete plus has withdrawable", () => {
      const delegation: MultiversXDelegation = {
        address: "erd1...",
        contract: "erd1qqqqqqqq...",
        userActiveStake: "0",
        claimableRewards: "0",
        userUnBondable: "500000000000000000",
        userUndelegatedList: [
          { amount: "200000000000000000", seconds: 0 }, // Complete
        ],
      };
      
      expect(mapDelegationState(delegation)).toBe("inactive");
    });
  });
});
```

**Unit Tests (`src/logic/mappers.test.ts` additions):**

```typescript
describe("mapToStake", () => {
  const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
  const validatorContract = "erd1qqqqqqqqqqqqqpgq5774jcntdqkzv62tlvvhfn2y7eevnph6y4tsgsv3gf";

  it("maps active delegation to Stake object", () => {
    const delegation: MultiversXDelegation = {
      address: testAddress,
      contract: validatorContract,
      userActiveStake: "1000000000000000000",
      claimableRewards: "50000000000000000",
      userUnBondable: "0",
      userUndelegatedList: [],
    };

    const stake = mapToStake(delegation, testAddress);

    expect(stake.uid).toBe(`${testAddress}-${validatorContract}`);
    expect(stake.address).toBe(testAddress);
    expect(stake.delegate).toBe(validatorContract);
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amount).toBe(1050000000000000000n); // active + rewards
    expect(stake.amountDeposited).toBe(1000000000000000000n);
    expect(stake.amountRewarded).toBe(50000000000000000n);
  });

  it("includes undelegating amounts in total", () => {
    const delegation: MultiversXDelegation = {
      address: testAddress,
      contract: validatorContract,
      userActiveStake: "1000000000000000000",
      claimableRewards: "0",
      userUnBondable: "200000000000000000",
      userUndelegatedList: [
        { amount: "300000000000000000", seconds: 3600 },
        { amount: "100000000000000000", seconds: 0 },
      ],
    };

    const stake = mapToStake(delegation, testAddress);

    // Total: 1000 + 0 + 200 + 300 + 100 = 1600 * 10^15
    expect(stake.amount).toBe(1600000000000000000n);
    expect(stake.state).toBe("deactivating");
  });

  it("includes details with undelegation info", () => {
    const delegation: MultiversXDelegation = {
      address: testAddress,
      contract: validatorContract,
      userActiveStake: "0",
      claimableRewards: "0",
      userUnBondable: "500000000000000000",
      userUndelegatedList: [
        { amount: "200000000000000000", seconds: 0 },
      ],
    };

    const stake = mapToStake(delegation, testAddress);

    expect(stake.details).toEqual({
      userUnBondable: "500000000000000000",
      userUndelegatedList: [{ amount: "200000000000000000", seconds: 0 }],
    });
  });

  it("handles empty delegation (zero amounts)", () => {
    const delegation: MultiversXDelegation = {
      address: testAddress,
      contract: validatorContract,
      userActiveStake: "0",
      claimableRewards: "0",
      userUnBondable: "0",
      userUndelegatedList: [],
    };

    const stake = mapToStake(delegation, testAddress);

    expect(stake.amount).toBe(0n);
    expect(stake.state).toBe("inactive");
    expect(stake.amountDeposited).toBe(0n);
    expect(stake.amountRewarded).toBe(0n);
  });
});
```

**Test Addresses (for future integration tests in Story 3.1):**

| Purpose | Address |
|---------|---------|
| Has active delegations | Find via delegation API or use known staking address |
| Has undelegating | Find via delegation API |
| Empty/No delegations | Any address without delegations |

### Previous Story Intelligence

**From Story 2.3 (Operations Sorting):**

- Established pattern for sorting with secondary keys
- Unit test patterns with mock data
- JSDoc documentation standards
- Test file organization with describe blocks

**From Epic 1 (Core API):**

- Mapper function patterns (mapToBalance, mapToEsdtBalance, mapToOperation)
- Import organization patterns
- BigInt conversion utilities (toBigInt helper)
- Test patterns for pure functions

**Learnings Applied:**

1. Use BigInt for all amount calculations (not BigNumber)
2. Follow mapTo* naming convention
3. State determination uses field analysis, not string mapping
4. Include comprehensive edge case tests

### Git Intelligence Summary

**Recent Commits (from Epic 2):**

- `listOperations.ts` - Established patterns for data transformation
- `mappers.ts` - Added mapToOperation with ESDT handling
- Testing patterns with mocked API clients

**Code Patterns Established:**

- Mapper functions are pure (no side effects)
- State derives from data fields, not explicit status strings
- Amount calculations use BigInt consistently
- JSDoc with `@param` and `@returns` only

### Latest Tech Information

**MultiversX Staking Protocol:**

- Unbonding period: ~10 days (864,000 seconds on mainnet)
- No explicit "activating" state - staking is immediate
- Delegation positions can have mixed states (active stake + undelegating)
- Rewards accrue continuously, claimable at any time

**StakeState Type (from coin-framework):**

```typescript
type StakeState = "inactive" | "activating" | "active" | "deactivating";
```

- `inactive`: Not staked, or stake fully withdrawn
- `activating`: Stake pending activation (not used for MultiversX)
- `active`: Stake is earning rewards
- `deactivating`: Unstaking in progress (waiting period)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] - Original story definition and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-002] - State mapping constant pattern
- [Source: libs/coin-modules/coin-multiversx/src/types.ts#L33-45] - MultiversXDelegation type definition
- [Source: libs/coin-modules/coin-multiversx/src/logic.ts#L61-77] - computeDelegationBalance reference
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md#Task 3b] - State mapping task
- [Source: _bmad-output/project-context.md#Delegation State Mapping] - State mapping constants

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- All 17 stateMapping.test.ts tests pass
- All 56 mappers.test.ts tests pass (added 6 new tests for state mapping and details field)
- Pre-existing test failures in listOperations.test.ts (2 tests) unrelated to this story

### Completion Notes List

- Created `stateMapping.ts` with `mapDelegationState()` function implementing field-based state determination
- Implemented state precedence: deactivating > inactive > active
- Key logic: `seconds > 0` means pending (deactivating), `seconds === 0` means complete (inactive)
- Refactored `mappers.ts` to use `mapDelegationState()` instead of inline `getDelegationState()`
- Added `details` field to Stake object containing `userUnBondable` and `userUndelegatedList`
- Adjusted `mapToStake` amount aggregation to avoid double-counting withdrawable stake when both `userUnBondable` and completed undelegations are present
- Added defensive handling for undefined/null fields with default values
- Comprehensive test coverage: 17 tests for stateMapping, 6 new tests for mapToStake details/state mapping

### Change Log

- 2026-02-02: Implemented delegation state mapping (Story 3.2)
  - Created stateMapping.ts with DELEGATION_STATE_MAP and mapDelegationState function
  - Updated mappers.ts to use mapDelegationState and added details field to Stake
  - Updated index.ts to export mapDelegationState and DELEGATION_STATE_MAP
  - Created stateMapping.test.ts with 17 comprehensive tests
  - Updated mappers.test.ts with 6 new tests for improved state mapping and details field

### Senior Developer Review (AI)

Reviewer: Hedi.edelbloute on 2026-02-03

#### Summary

- ✅ Fixed ADR/story mismatch by updating `DELEGATION_STATE_MAP` to document `"staked" | "unstaking" | "withdrawable"` mappings.
- ✅ Updated AC #4 to reflect MultiversX reality (no `"activating"` state; immediate activation).
- ✅ Fixed potential double-counting in `mapToStake` when both `userUnBondable` and completed undelegations (seconds === 0) are present.
- ⚠️ Test execution could not be verified in this environment due to a native crash when running `pnpm coin:multiversx test`. Please run locally/CI.

#### Findings fixed in code

- **[HIGH] AC mismatch (activating)**: corrected AC wording to align with chain behavior.
- **[MEDIUM] ADR-002 documentation mismatch**: fixed `DELEGATION_STATE_MAP` keys/values.
- **[HIGH] Potential amount double-count**: updated `mapToStake` aggregation and added regression test.

### File List

**Files Created:**
- libs/coin-modules/coin-multiversx/src/logic/stateMapping.ts
- libs/coin-modules/coin-multiversx/src/logic/stateMapping.test.ts

**Files Modified:**
- libs/coin-modules/coin-multiversx/src/logic/mappers.ts
- libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts
- libs/coin-modules/coin-multiversx/src/logic/index.ts
