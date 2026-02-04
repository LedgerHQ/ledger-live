# Story 1.2: Native EGLD Balance Query

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to retrieve the native EGLD balance for any MultiversX address,
So that I can display account balances to users.

## Acceptance Criteria

1. **Given** a valid MultiversX address with EGLD funds
   **When** I call `api.getBalance(address)`
   **Then** I receive an array containing at least one `Balance` object with `asset.type === "native"` and the correct `value` as `bigint`

2. **Given** a valid MultiversX address with zero EGLD balance
   **When** I call `api.getBalance(address)`
   **Then** I receive `[{ value: 0n, asset: { type: "native" } }]`
   **And** the array is **never empty** (FR4 compliance - CRITICAL)

3. **Given** an invalid MultiversX address
   **When** I call `api.getBalance(address)`
   **Then** an error is thrown with a descriptive message

## Tasks / Subtasks

- [x] Task 1: Create `logic/getBalance.ts` with `getBalance()` function (AC: #1, #2, #3)
  - [x] 1.1 Create file at `libs/coin-modules/coin-multiversx/src/logic/getBalance.ts`
  - [x] 1.2 Implement `getBalance(api: MultiversXApi, address: string): Promise<Balance[]>`
  - [x] 1.3 Use existing `api.getAccountDetails(address)` to fetch native balance
  - [x] 1.4 Return native balance as `Balance` with `asset: { type: "native" }`
  - [x] 1.5 CRITICAL: Always return array with at least one element (0n for empty accounts)

- [x] Task 2: Create `logic/mappers.ts` with `mapToBalance()` mapper function (AC: #1, #2)
  - [x] 2.1 Create file at `libs/coin-modules/coin-multiversx/src/logic/mappers.ts`
  - [x] 2.2 Implement `mapToBalance(balance: string): Balance` for native EGLD
  - [x] 2.3 Convert string balance to `bigint` using `BigInt(balance)`
  - [x] 2.4 Follow ADR-001 naming pattern: `mapTo{TargetType}`

- [x] Task 3: Create unit tests for `getBalance()` (AC: #1, #2, #3)
  - [x] 3.1 Create `libs/coin-modules/coin-multiversx/src/logic/getBalance.test.ts`
  - [x] 3.2 Test: Account with positive balance returns correct value
  - [x] 3.3 Test: Empty account returns `[{ value: 0n, asset: { type: "native" } }]`
  - [x] 3.4 Test: Invalid address throws descriptive error
  - [x] 3.5 Achieve 100% code coverage for getBalance function

- [x] Task 4: Create unit tests for `mapToBalance()` (AC: #1, #2)
  - [x] 4.1 Create/update `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts`
  - [x] 4.2 Test: Maps positive balance string to correct bigint
  - [x] 4.3 Test: Maps "0" to 0n bigint
  - [x] 4.4 Test: Handles large balance values correctly

- [x] Task 5: Wire `getBalance` into API (if Story 1.1 complete) (AC: #1, #2, #3)
  - [x] 5.1 Update `api/index.ts` to use `getBalance` from logic module
  - [x] 5.2 Ensure `createApi()` exposes `getBalance` method correctly

## Dev Notes

### Architecture & Design Patterns

**Follow ADR-001 (Data Transformation):**
- Use dedicated mapper function `mapToBalance()` in `logic/mappers.ts`
- Pure functions that are easily unit testable
- Clear separation between network data and standardized types

**Follow ADR-003 (Error Handling):**
- Wrap network errors with descriptive context
- Format: `"Failed to fetch account ${address}: ${error.message}"`

**CRITICAL REQUIREMENT (FR4):**
The `getBalance()` function MUST return `[{ value: 0n, asset: { type: "native" } }]` for empty accounts.
- NEVER return an empty array `[]`
- ALWAYS include at least the native balance entry

### Source Code Reference

**Existing Implementation to Reuse:**

```12:15:libs/coin-modules/coin-multiversx/src/api/sdk.ts
export const getAccount = async (addr: string): Promise<MultiversXAccount> => {
  const { balance, nonce, isGuarded } = await api.getAccountDetails(addr);
  // ... wraps balance in BigNumber
};
```

**API Endpoint:**
- `GET {API_URL}/accounts/{address}?withGuardianInfo=true`
- Returns: `{ data: { balance: string, nonce: number, isGuarded: boolean } }`

**Existing `getAccountDetails` in apiCalls.ts:**

```66:79:libs/coin-modules/coin-multiversx/src/api/apiCalls.ts
async getAccountDetails(addr: string) {
  const {
    data: { balance, nonce, isGuarded },
  } = await network<MultiversXAccount>({
    method: "GET",
    url: `${this.API_URL}/accounts/${addr}?withGuardianInfo=true`,
  });
  return { balance, nonce, isGuarded };
}
```

### Implementation Pattern

```typescript
// libs/coin-modules/coin-multiversx/src/logic/getBalance.ts
import type { Balance } from "@ledgerhq/coin-framework/api/index";
import MultiversXApi from "../api/apiCalls";
import { mapToBalance } from "./mappers";

/**
 * Retrieves native EGLD balance for a MultiversX address.
 * @param api - MultiversX API client
 * @param address - MultiversX address (erd1...)
 * @returns Array with native balance (never empty)
 */
export async function getBalance(api: MultiversXApi, address: string): Promise<Balance[]> {
  const { balance } = await api.getAccountDetails(address);
  
  // CRITICAL: Always return array with native balance, even if 0
  return [mapToBalance(balance)];
}
```

```typescript
// libs/coin-modules/coin-multiversx/src/logic/mappers.ts
import type { Balance } from "@ledgerhq/coin-framework/api/index";

/**
 * Maps raw balance string to standardized Balance object.
 * @param balance - Balance string from API
 * @returns Balance with native asset type
 */
export function mapToBalance(balance: string): Balance {
  return {
    value: BigInt(balance),
    asset: { type: "native" },
  };
}
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `src/logic/getBalance.ts` | getBalance function implementation |
| `src/logic/mappers.ts` | mapToBalance mapper function |
| `src/logic/getBalance.test.ts` | Unit tests for getBalance |
| `src/logic/mappers.test.ts` | Unit tests for mappers |

**Folder Structure:**
```
coin-multiversx/src/
├── api/           # Existing - will consume logic module
├── logic/         # NEW - pure business logic
│   ├── getBalance.ts
│   ├── getBalance.test.ts
│   ├── mappers.ts
│   ├── mappers.test.ts
│   └── index.ts   # Re-exports
├── network/       # EXISTING - unchanged
├── bridge/        # EXISTING - unchanged
└── types/         # EXISTING - unchanged
```

### Testing Standards

**Test File Location:** Co-located with source (`getBalance.test.ts` next to `getBalance.ts`)

**Test Structure (per ADR-005):**
```typescript
describe("getBalance", () => {
  it("returns native EGLD balance for funded account", async () => {});
  it("returns zero balance for empty account (not empty array)", async () => {});
  it("throws error for invalid address", async () => {});
});
```

**Mock Pattern:** Mock `api.getAccountDetails()` for unit tests

### Type Information

**Import from coin-framework:**
```typescript
import type { Balance } from "@ledgerhq/coin-framework/api/index";

// Balance type structure:
interface Balance {
  value: bigint;
  asset: AssetInfo;
}

// For native EGLD:
interface NativeAssetInfo {
  type: "native";
}
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-001] - Data transformation via mappers
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2] - Story requirements
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts] - Existing API implementation
- [Source: libs/coin-framework/src/api/types.ts] - Balance type definition
- [Source: libs/coin-modules/coin-filecoin/src/logic/] - Reference implementation pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- No debug issues encountered

### Completion Notes List

- Implemented `getBalance()` function following ADR-001 data transformation pattern
- Created `mapToBalance()` mapper for converting string balance to standardized Balance type
- FR4 compliance ensured: getBalance always returns array with at least one element (never empty)
- Address validation added to fail fast for invalid bech32 addresses (AC3)
- Error handling wraps API errors with descriptive context per ADR-003
- Achieved 100% statement/branch/function/line coverage for `getBalance()` logic file
- All getBalance unit tests pass (funded account, empty account, invalid address, FR4 compliance, error wrapping branches)
- All 4 unit tests for mapToBalance pass (positive balance, zero, large values, asset type)
- API factory wired to use logic module's getBalance function
- Build passes with no TypeScript errors
- All 28 tests in coin-multiversx pass (no regressions)

### File List

**New Files:**
- `libs/coin-modules/coin-multiversx/src/logic/getBalance.ts` - getBalance function implementation
- `libs/coin-modules/coin-multiversx/src/logic/getBalance.test.ts` - Unit tests for getBalance
- `libs/coin-modules/coin-multiversx/src/logic/mappers.ts` - mapToBalance mapper function
- `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts` - Unit tests for mappers

**Modified Files:**
- `libs/coin-modules/coin-multiversx/src/logic/index.ts` - Added exports for mapToBalance and getBalance
- `libs/coin-modules/coin-multiversx/src/api/index.ts` - Wired getBalance from logic module into API factory

**Also present in branch (from Story 1.1 / out of scope for 1.2):**
- `libs/coin-modules/coin-multiversx/package.json`
- `libs/coin-modules/coin-multiversx/src/api/index.test.ts`
- `libs/coin-modules/coin-multiversx/src/api/types.ts`
- `libs/coin-modules/coin-multiversx/src/index.ts`

## Senior Developer Review (AI)

Date: 2026-01-30

### Findings

- **Fixed:** AC3 was only implicitly handled via network errors; `getBalance()` now validates MultiversX bech32 addresses and fails fast with a descriptive error.
- **Fixed:** `getBalance()` catch branch coverage was incomplete; unit tests now cover both `Error` and non-`Error` thrown values.
- **Fixed:** Unit tests now use a valid MultiversX bech32 address for “valid address” scenarios, aligning tests with real validation rules.
- **Verified:** FR4 compliance retained — `getBalance()` always returns a non-empty `Balance[]`.

## Change Log

- 2026-01-30: Story 1.2 implemented - Native EGLD balance query via getBalance() function
- 2026-01-30: Code review fixes - add address validation + improve tests/coverage + update error wrapping format
