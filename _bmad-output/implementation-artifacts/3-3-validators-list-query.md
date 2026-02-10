# Story 3.3: Validators List Query

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Coin Module Developer**,
I want to retrieve the list of available validators with APR, identity, and commission,
So that I can help users choose validators for delegation.

## Acceptance Criteria

1. **Given** the MultiversX network is accessible
   **When** I call `api.getValidators()`
   **Then** I receive a `Page<Validator>` object containing an array of `Validator` objects

2. **Given** a validator with identity information
   **When** the validator is mapped
   **Then** the `Validator` object includes `name` (from identity), `address` (contract address), `apy` (from aprValue), and `commissionRate` (from serviceFee)

3. **Given** a validator without identity information
   **When** the validator is mapped
   **Then** the `Validator` object has the address as `name`, correct numerical fields, and empty/undefined identity fields

4. **Given** multiple validators on the network
   **When** I call `api.getValidators()`
   **Then** I receive all active validators (disabled providers are filtered out) with their complete metadata

5. **Given** the pagination interface
   **When** I call `api.getValidators(cursor?)`
   **Then** the `Page<Validator>` object has `items` array and `next` cursor (undefined since all validators are returned in single page)

## Tasks / Subtasks

- [x] Task 1: Create mapper function for MultiversXProvider to Validator (AC: #2, #3)
  - [x] 1.1: Create `mapToValidator()` function in `src/logic/mappers.ts`
  - [x] 1.2: Map `contract` → `address` (validator contract address)
  - [x] 1.3: Map `identity.name` → `name` (fallback to `contract` if missing/empty)
  - [x] 1.4: Map `identity.description` → `description`
  - [x] 1.5: Map `identity.url` → `url`
  - [x] 1.6: Map `identity.avatar` → `logo`
  - [x] 1.7: Map `totalActiveStake` → `balance` (convert to `bigint`)
  - [x] 1.8: Map `serviceFee` → `commissionRate` (keep as string, it's already a percentage)
  - [x] 1.9: Map `aprValue` → `apy` (convert from percentage to decimal: divide by 100)
  - [x] 1.10: Handle missing/undefined identity fields gracefully

- [x] Task 2: Create logic function for getValidators (AC: #1, #4)
  - [x] 2.1: Create `src/logic/getValidators.ts` with `getValidators()` function
  - [x] 2.2: Call `apiClient.getProviders()` to fetch all MultiversX providers
  - [x] 2.3: Filter out disabled providers (`disabled !== true`)
  - [x] 2.4: Map each provider to `Validator` using `mapToValidator()`
  - [x] 2.5: Return `Page<Validator>` with `items` array and `next: undefined`

- [x] Task 3: Integrate getValidators into createApi (AC: #5)
  - [x] 3.1: Import `getValidators` from logic module in `src/api/index.ts`
  - [x] 3.2: Add `getValidators` method to the returned API object
  - [x] 3.3: Ignore cursor parameter (all validators returned in single page)

- [x] Task 4: Export from logic index (AC: #1)
  - [x] 4.1: Add export for `mapToValidator` in `src/logic/index.ts`
  - [x] 4.2: Add export for `getValidators` in `src/logic/index.ts`

- [x] Task 5: Add unit tests for mapToValidator (AC: #2, #3)
  - [x] 5.1: Create tests in `src/logic/mappers.test.ts` for `mapToValidator()`
  - [x] 5.2: Test mapping with complete identity information
  - [x] 5.3: Test mapping with empty/missing identity object
  - [x] 5.4: Test mapping with partial identity (some fields missing)
  - [x] 5.5: Test correct APY conversion (aprValue/100)
  - [x] 5.6: Test balance conversion from string to bigint
  - [x] 5.7: Test commissionRate (serviceFee) is passed through correctly

- [x] Task 6: Add unit tests for getValidators logic (AC: #1, #4)
  - [x] 6.1: Create `src/logic/getValidators.test.ts`
  - [x] 6.2: Test empty providers list returns empty Page
  - [x] 6.3: Test single provider mapping
  - [x] 6.4: Test multiple providers mapping
  - [x] 6.5: Test disabled providers are filtered out
  - [x] 6.6: Test Page structure (items array, next undefined)

- [x] Task 7: Add integration tests (AC: #1, #2, #4)
  - [x] 7.1: Add `getValidators()` integration test in `src/api/index.integ.test.ts`
  - [x] 7.2: Test returns Page with validators array
  - [x] 7.3: Test validators have required fields (address, name, apy, commissionRate)
  - [x] 7.4: Test APY is a reasonable value (between 0 and 1)
  - [x] 7.5: Test validators list is non-empty (mainnet has active validators)
  - [x] 7.6: Test `next` cursor is undefined (all validators in single page)

- [x] Task 8: Add JSDoc documentation (AC: #1)
  - [x] 8.1: Add JSDoc to `mapToValidator()` with @param and @returns
  - [x] 8.2: Add JSDoc to `getValidators()` with @param and @returns

## Dev Notes

### Architecture Compliance

**ADR-001 (Data Transformation):** Create `mapToValidator()` mapper function in `src/logic/mappers.ts` to transform `MultiversXProvider` to Alpaca `Validator` type.

**ADR-002 (State Mapping):** Not applicable to this story - validators don't have state mapping.

**ADR-003 (Error Handling):** Throw generic `Error` with descriptive messages for network failures. Format: `"{methodName} failed: {reason}"`.

**ADR-004 (Token Handling):** Not applicable to this story - validators don't involve token discrimination.

**ADR-005 (Test Structure):** Add unit tests to `mappers.test.ts` and `getValidators.test.ts`. Add integration tests to `src/api/index.integ.test.ts`.

### Technical Requirements

**MultiversXProvider Type (from `src/types.ts`):**

```typescript
export type MultiversXProvider = {
  contract: string;          // Validator contract address → maps to Validator.address
  owner: string;
  serviceFee: string;        // Commission rate as string → maps to Validator.commissionRate
  maxDelegationCap: string;
  totalActiveStake: string;  // Total staked → maps to Validator.balance (as bigint)
  apr: string;               // APR as string percentage
  aprValue: number;          // APR as number percentage → maps to Validator.apy (divide by 100)
  disabled?: boolean;        // If true, filter out from results
  identity: {
    key: string;
    name: string;            // → maps to Validator.name
    avatar: string;          // → maps to Validator.logo
    description: string;     // → maps to Validator.description
    url: string;             // → maps to Validator.url
  };
  // ... other fields not needed for Validator mapping
};
```

**Target Validator Type (from `@ledgerhq/coin-framework/api/types`):**

```typescript
export type Validator = {
  address: string;           // Required - validator contract address
  name: string;              // Required - human-readable name (or address fallback)
  description?: string;      // Optional - validator description
  url?: string;              // Optional - validator website
  logo?: string;             // Optional - avatar/logo URL
  balance?: bigint;          // Optional - total staked amount
  commissionRate?: string;   // Optional - commission as string
  apy?: number;              // Optional - APY as decimal (0-1)
};
```

**Mapper Function Implementation:**

```typescript
import type { Validator } from "@ledgerhq/coin-framework/api/types";
import type { MultiversXProvider } from "../types";

/**
 * Maps a MultiversX provider to an Alpaca Validator.
 * @param provider - The MultiversX provider from the delegation API
 * @returns A standardized Validator object
 */
export function mapToValidator(provider: MultiversXProvider): Validator {
  return {
    address: provider.contract,
    name: provider.identity?.name || provider.contract,
    description: provider.identity?.description || undefined,
    url: provider.identity?.url || undefined,
    logo: provider.identity?.avatar || undefined,
    balance: BigInt(provider.totalActiveStake || "0"),
    commissionRate: provider.serviceFee,
    apy: provider.aprValue / 100, // Convert from percentage (e.g., 8.5) to decimal (0.085)
  };
}
```

**Logic Function Implementation:**

```typescript
import type { Page, Validator } from "@ledgerhq/coin-framework/api/types";
import type MultiversXApi from "../api/apiCalls";
import { mapToValidator } from "./mappers";

/**
 * Retrieves the list of available validators on MultiversX.
 * @param apiClient - The MultiversX API client
 * @returns A Page containing all active validators
 */
export async function getValidators(apiClient: MultiversXApi): Promise<Page<Validator>> {
  const providers = await apiClient.getProviders();
  
  // Filter out disabled providers
  const activeProviders = providers.filter(p => p.disabled !== true);
  
  // Map to Validator type
  const validators = activeProviders.map(mapToValidator);
  
  return {
    items: validators,
    next: undefined, // All validators returned in single page
  };
}
```

**API Integration:**

```typescript
// In src/api/index.ts - add to createApi return object:
getValidators: async () => doGetValidators(api),
```

### Library & Framework Requirements

**No new dependencies required.**

Uses existing:
- `@ledgerhq/coin-framework/api/types` for `Validator` and `Page` types
- Existing `MultiversXApi.getProviders()` method from `apiCalls.ts`
- Network layer already configured for delegation API endpoint

**Environment Variables:**
- `MULTIVERSX_DELEGATION_API_ENDPOINT` - Delegation API base URL (default: `https://delegations-elrond.coin.ledger.com`)

### File Structure Requirements

**Files to Create:**

| File | Purpose |
|------|---------|
| `libs/coin-modules/coin-multiversx/src/logic/getValidators.ts` | Logic function for fetching and filtering validators |
| `libs/coin-modules/coin-multiversx/src/logic/getValidators.test.ts` | Unit tests for getValidators logic |

**Files to Modify:**

| File | Change |
|------|--------|
| `libs/coin-modules/coin-multiversx/src/logic/mappers.ts` | Add `mapToValidator()` function |
| `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts` | Add unit tests for `mapToValidator()` |
| `libs/coin-modules/coin-multiversx/src/logic/index.ts` | Export `mapToValidator` and `getValidators` |
| `libs/coin-modules/coin-multiversx/src/api/index.ts` | Add `getValidators` method to createApi |
| `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts` | Add integration tests |

### Existing Code to Leverage

**Existing Provider Fetching (from `sdk.ts`):**

```typescript
export const getProviders = async (): Promise<MultiversXProvider[]> => {
  const providers = await api.getProviders();
  return providers;
};
```

**Existing API Method (from `apiCalls.ts`):**

```typescript
async getProviders(): Promise<MultiversXProvider[]> {
  const { data: providers } = await network<MultiversXProvider[]>({
    method: "GET",
    url: `${this.DELEGATION_API_URL}/providers`,
  });
  return providers;
}
```

**Existing Usage in Preload (from `preload.ts`):**

The `getProviders()` function is already used in preloading for the bridge. This story exposes the same data through the Alpaca API interface.

### Import Pattern

Follow established import patterns from existing logic functions:

```typescript
// In src/logic/getValidators.ts
import type { Page, Validator } from "@ledgerhq/coin-framework/api/types";
import type MultiversXApi from "../api/apiCalls";
import { mapToValidator } from "./mappers";

// In src/logic/mappers.ts
import type { Validator } from "@ledgerhq/coin-framework/api/types";
import type { MultiversXProvider } from "../types";

// In src/api/index.ts
import { getValidators as doGetValidators } from "../logic";
```

### Testing Requirements

**Unit Tests for mapToValidator (`src/logic/mappers.test.ts`):**

```typescript
describe("mapToValidator", () => {
  it("maps provider with complete identity to Validator", () => {
    const provider: MultiversXProvider = {
      contract: "erd1qqqqqqqqqqqqqpgq...",
      serviceFee: "10",
      totalActiveStake: "1000000000000000000000", // 1000 EGLD
      aprValue: 8.5,
      identity: {
        key: "key123",
        name: "Ledger Staking",
        avatar: "https://example.com/logo.png",
        description: "Professional staking provider",
        url: "https://ledger.com",
        twitter: "@ledger",
      },
      // ... other required fields
    };
    
    const validator = mapToValidator(provider);
    
    expect(validator.address).toBe("erd1qqqqqqqqqqqqqpgq...");
    expect(validator.name).toBe("Ledger Staking");
    expect(validator.description).toBe("Professional staking provider");
    expect(validator.url).toBe("https://ledger.com");
    expect(validator.logo).toBe("https://example.com/logo.png");
    expect(validator.balance).toBe(1000000000000000000000n);
    expect(validator.commissionRate).toBe("10");
    expect(validator.apy).toBe(0.085); // 8.5 / 100
  });

  it("uses contract address as name when identity.name is empty", () => {
    const provider = createMockProvider({
      contract: "erd1qqqqqqqqqqqqqpgq...",
      identity: { name: "" },
    });
    
    const validator = mapToValidator(provider);
    expect(validator.name).toBe("erd1qqqqqqqqqqqqqpgq...");
  });

  it("handles missing identity gracefully", () => {
    const provider = createMockProvider({
      contract: "erd1qqqqqqqqqqqqqpgq...",
      identity: undefined,
    });
    
    const validator = mapToValidator(provider);
    expect(validator.name).toBe("erd1qqqqqqqqqqqqqpgq...");
    expect(validator.description).toBeUndefined();
    expect(validator.url).toBeUndefined();
    expect(validator.logo).toBeUndefined();
  });

  it("converts APY from percentage to decimal", () => {
    const provider = createMockProvider({ aprValue: 12.5 });
    const validator = mapToValidator(provider);
    expect(validator.apy).toBe(0.125);
  });

  it("converts totalActiveStake to bigint balance", () => {
    const provider = createMockProvider({
      totalActiveStake: "5000000000000000000000",
    });
    const validator = mapToValidator(provider);
    expect(validator.balance).toBe(5000000000000000000000n);
  });
});
```

**Unit Tests for getValidators (`src/logic/getValidators.test.ts`):**

```typescript
describe("getValidators", () => {
  it("returns empty Page when no providers exist", async () => {
    const mockApiClient = { getProviders: jest.fn().mockResolvedValue([]) };
    
    const result = await getValidators(mockApiClient);
    
    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("filters out disabled providers", async () => {
    const mockApiClient = {
      getProviders: jest.fn().mockResolvedValue([
        createMockProvider({ contract: "active1", disabled: false }),
        createMockProvider({ contract: "disabled1", disabled: true }),
        createMockProvider({ contract: "active2" }), // disabled undefined = active
      ]),
    };
    
    const result = await getValidators(mockApiClient);
    
    expect(result.items).toHaveLength(2);
    expect(result.items.map(v => v.address)).toEqual(["active1", "active2"]);
  });

  it("maps all active providers to Validators", async () => {
    const mockApiClient = {
      getProviders: jest.fn().mockResolvedValue([
        createMockProvider({ contract: "validator1", identity: { name: "V1" } }),
        createMockProvider({ contract: "validator2", identity: { name: "V2" } }),
      ]),
    };
    
    const result = await getValidators(mockApiClient);
    
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("V1");
    expect(result.items[1].name).toBe("V2");
  });

  it("returns Page with undefined next cursor", async () => {
    const mockApiClient = {
      getProviders: jest.fn().mockResolvedValue([createMockProvider({})]),
    };
    
    const result = await getValidators(mockApiClient);
    
    expect(result.next).toBeUndefined();
  });
});
```

**Integration Tests (`src/api/index.integ.test.ts`):**

```typescript
describe("getValidators", () => {
  it("returns Page with validators array", async () => {
    const api = createApi();
    const result = await api.getValidators();
    
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("returns validators with required fields", async () => {
    const api = createApi();
    const { items } = await api.getValidators();
    
    expect(items.length).toBeGreaterThan(0);
    
    for (const validator of items.slice(0, 5)) {
      expect(validator.address).toBeDefined();
      expect(typeof validator.address).toBe("string");
      expect(validator.address.startsWith("erd1")).toBe(true);
      
      expect(validator.name).toBeDefined();
      expect(typeof validator.name).toBe("string");
      
      expect(validator.apy).toBeDefined();
      expect(typeof validator.apy).toBe("number");
      
      expect(validator.commissionRate).toBeDefined();
      expect(typeof validator.commissionRate).toBe("string");
    }
  });

  it("returns APY as decimal between 0 and 1", async () => {
    const api = createApi();
    const { items } = await api.getValidators();
    
    for (const validator of items.slice(0, 10)) {
      if (validator.apy !== undefined) {
        expect(validator.apy).toBeGreaterThanOrEqual(0);
        expect(validator.apy).toBeLessThanOrEqual(1);
      }
    }
  });

  it("returns non-empty validators list on mainnet", async () => {
    const api = createApi();
    const { items } = await api.getValidators();
    
    expect(items.length).toBeGreaterThan(10); // MultiversX has many validators
  });

  it("returns undefined next cursor (all in single page)", async () => {
    const api = createApi();
    const result = await api.getValidators();
    
    expect(result.next).toBeUndefined();
  });

  it("returns validators with balance as bigint", async () => {
    const api = createApi();
    const { items } = await api.getValidators();
    
    for (const validator of items.slice(0, 5)) {
      if (validator.balance !== undefined) {
        expect(typeof validator.balance).toBe("bigint");
        expect(validator.balance).toBeGreaterThanOrEqual(0n);
      }
    }
  });
});
```

### Project Structure Notes

**Alignment with Unified Project Structure:**

- Logic function created in `src/logic/` folder following established patterns
- Mapper function in `src/logic/mappers.ts` following ADR-001
- Unit tests co-located with source files
- Integration tests in single `index.integ.test.ts` file (ADR-005)

**Detected Conflicts or Variances:**

None. This story follows the exact patterns established in Epic 1 and Epic 2.

### Previous Story Intelligence

**From Story 3.1 (Delegation Positions Query):**

- Pattern for creating logic functions that call apiCalls methods
- Pattern for mapping MultiversX types to Alpaca types
- Similar structure: fetch data → filter → map → return Page

**From Story 3.2 (Delegation State Mapping):**

- State mapping patterns (though not applicable here)
- Testing patterns for mapper functions
- JSDoc documentation patterns

**From Epic 1 & 2:**

- `mappers.ts` structure and patterns established
- Integration test patterns in `index.integ.test.ts`
- API integration patterns in `createApi()`

### Git Intelligence Summary

**Recent Commits Analysis:**

From `git log --oneline -10`:
- `d626420059 feat: coin-filecoin alpaca api` - Reference implementation
- `1e5b9e2b4f feat: coin-algorand alpaca api` - Another reference

**Code Patterns Established:**

- Logic functions in separate files in `src/logic/`
- Mapper functions in `src/logic/mappers.ts`
- Export all public functions from `src/logic/index.ts`
- Integration tests verify real network responses

### Latest Tech Information

**MultiversX Delegation API:**

The delegation API endpoint (`https://delegations-elrond.coin.ledger.com/providers`) returns the full list of staking providers in a single response. No pagination is required at the API level, so the Alpaca `Page<Validator>` response will have `next: undefined`.

**Validator Data Availability:**

All validators on MultiversX mainnet have:
- Contract address (always present)
- APR/APY data (always present)
- Service fee/commission (always present)
- Identity info (optional - some validators don't set identity)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] - Original story definition and acceptance criteria
- [Source: _bmad-output/implementation-artifacts/tech-spec-alpaca-api-coin-multiversx.md] - Technical specification with Validator type mapping
- [Source: libs/coin-modules/coin-multiversx/src/types.ts#MultiversXProvider] - Provider type definition
- [Source: libs/coin-framework/src/api/types.ts#Validator] - Target Validator type
- [Source: libs/coin-modules/coin-multiversx/src/api/apiCalls.ts#getProviders] - Existing provider fetching
- [Source: libs/coin-modules/coin-multiversx/src/preload.ts] - Existing usage of getProviders

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Cursor)

### Debug Log References

- Implemented mapper + logic + API integration + exports.
- Added unit + integration tests for `getValidators`.
- Ran `pnpm -C libs/coin-modules/coin-multiversx test`, `lint`, and `test-integ` (focused on `getValidators`).

### Completion Notes List

- ✅ Added `mapToValidator()` mapper and robust identity fallback behavior.
- ✅ Implemented `getValidators()` logic (filters disabled providers, returns single-page `Page`).
- ✅ Wired `getValidators()` into `createApi()` and re-exported from `logic/index.ts`.
- ✅ Added unit tests for mapper + logic and integration tests against mainnet.

### Code Review Fixes (2026-02-03)

**Fixed Issues:**
- ✅ Removed duplicate export of `mapToValidator` in `logic/index.ts`
- ✅ Added validation for `aprValue` division (handles NaN, Infinity, null, undefined)
- ✅ Added validation for `totalActiveStake` BigInt conversion (handles invalid strings)
- ✅ Updated outdated JSDoc comment ("planned" → implemented)
- ✅ Improved error handling in `getValidators()` to preserve stack trace and error context
- ✅ Added edge case tests: whitespace-only identity name, aprValue (0, null, undefined, NaN, Infinity, large values)
- ✅ Added tests for invalid `totalActiveStake` strings and missing `commissionRate`

**Remaining Issues:**
- ⚠️ `getValidators.ts` and `getValidators.test.ts` are untracked (not committed to git) - needs `git add`

### File List

- `libs/coin-modules/coin-multiversx/src/api/index.ts`
- `libs/coin-modules/coin-multiversx/src/api/index.integ.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/getValidators.ts`
- `libs/coin-modules/coin-multiversx/src/logic/getValidators.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/index.ts`
- `libs/coin-modules/coin-multiversx/src/logic/mappers.ts`
- `libs/coin-modules/coin-multiversx/src/logic/mappers.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/listOperations.ts`
- `libs/coin-modules/coin-multiversx/src/logic/listOperations.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/getStakes.test.ts`
- `libs/coin-modules/coin-multiversx/src/logic/stateMapping.test.ts`
- `libs/coin-modules/coin-multiversx/src/__snapshots__/bridge.integration.test.ts.snap` (deleted)
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-02-03: Implemented `getValidators()` end-to-end (mapper, logic, API wiring, exports) with unit + integration tests.
