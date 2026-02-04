---
project_name: 'coin-multiversx'
scope: 'Alpaca API Implementation'
date: '2026-01-29'
status: 'complete'
rule_count: 15
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical rules for implementing the Alpaca API in coin-multiversx. Focus on unobvious details that ensure consistency._

---

## Technology Stack

| Technology | Version | Notes |
|------------|---------|-------|
| TypeScript | 5.4.3 | Strict mode, monorepo standard |
| Jest | catalog | Unit + integration tests |
| pnpm | 10.24.0 | Workspace package manager |

**Target Interface:** `Api<MemoNotSupported, TxDataNotSupported>` from `@ledgerhq/coin-framework/api/types`

---

## Critical Implementation Rules

### API Interface Compliance

- **MUST** implement all 14 methods from `Api` interface
- **MUST** use `createApi(config)` factory pattern returning `Api` type
- Unsupported methods **MUST** throw: `throw new Error("{methodName} is not supported")`
- Methods throwing: `getRewards`, `getBlock`, `getBlockInfo`, `craftRawTransaction`

### Empty Account Handling (CRITICAL)

```typescript
// ✅ CORRECT - Always return at least one Balance
getBalance: () => [{ value: 0n, asset: { type: "native" } }]

// ❌ WRONG - Never return empty array
getBalance: () => []
```

### Mapper Functions

- **Pattern:** `mapTo{TargetType}` prefix (e.g., `mapToBalance`, `mapToOperation`)
- **Location:** `src/logic/mappers.ts`
- **Rule:** Pure functions only, no side effects, no network calls

```typescript
// ✅ CORRECT
export function mapToBalance(raw: MultiversXAccountInfo): Balance[] { }

// ❌ WRONG
export function convertBalance(raw: any): Balance[] { }
export function toBalance(raw: MultiversXAccountInfo): Balance[] { }
```

### Type Naming

- **Pattern:** `MultiversX{TypeName}` prefix for chain-specific types
- Examples: `MultiversXAccountInfo`, `MultiversXDelegation`, `MultiversXProvider`

```typescript
// ✅ CORRECT
type MultiversXAccountInfo = { balance: string; nonce: number; };

// ❌ WRONG
type RawAccountInfo = { balance: string; };
type AccountInfo = { balance: string; }; // Conflicts with framework
```

### ESDT Token Handling

- Use `asset.type` discrimination, not separate code paths
- Native EGLD: `asset.type === "native"`
- ESDT tokens: `asset.type === "esdt"` with `assetReference` for token identifier

```typescript
// ✅ CORRECT - Unified flow
if (intent.asset.type === "native") {
  return craftNativeTransfer(intent);
} else if (intent.asset.type === "esdt") {
  return craftEsdtTransfer(intent);
}
```

### Delegation State Mapping

Use constant lookup table in `src/logic/stateMapping.ts`:

```typescript
export const DELEGATION_STATE_MAP: Record<string, StakeState> = {
  "staked": "active",
  "unstaking": "deactivating", 
  "withdrawable": "inactive",
};
```

---

## Testing Rules

### Test Structure

- **Unit tests:** Co-located `*.test.ts` files
- **Integration tests:** Single `src/api/index.integ.test.ts` file
- **Pattern:** Grouped by method with `describe()` blocks

```typescript
// ✅ CORRECT
describe("MultiversX API Integration", () => {
  describe("getBalance", () => {
    it("returns native EGLD balance for funded account", async () => {});
    it("returns zero balance for empty account (not empty array)", async () => {});
  });
});

// ❌ WRONG - flat structure
it("getBalance works", async () => {});
```

### Integration Test Requirements

- Run against **real MultiversX mainnet** (not mocked)
- Use known mainnet addresses with predictable data
- **Exclude `broadcast`** - requires real signatures
- Commands: `pnpm coin:multiversx test-integ`

### Coverage Requirements

- **100% coverage** for `logic/` functions
- Command: `pnpm coin:multiversx coverage`

---

## Import Organization

**Pattern:** External → Internal → Types (blank line separators)

```typescript
// ✅ CORRECT
import type { Balance, Operation } from "@ledgerhq/coin-framework/api/types";

import { fetchAccount } from "../network";
import { mapToBalance } from "../logic/mappers";

import type { MultiversXAccountInfo } from "../types";

// ❌ WRONG - mixed order
import { mapToBalance } from "../logic/mappers";
import type { Balance } from "@ledgerhq/coin-framework/api/types";
```

---

## JSDoc Style

**Pattern:** Minimal - `@param` and `@returns` only

```typescript
// ✅ CORRECT
/**
 * Maps MultiversX account info to standardized Balance array.
 * @param raw - Raw account data from explorer API
 * @returns Array of Balance objects (native + ESDT tokens)
 */
export function mapToBalance(raw: MultiversXAccountInfo): Balance[] { }

// ❌ WRONG - excessive
/**
 * @function mapToBalance
 * @description Maps account info...
 * @throws {Error} If raw is null
 * @example ...
 */
```

---

## Reference Implementation

**Primary reference:** `libs/coin-modules/coin-filecoin/src/api/`

When uncertain, check how coin-filecoin handles it.

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| Return empty array for empty accounts | Return `[{ value: 0n, asset: { type: "native" } }]` |
| `convertBalance()`, `toBalance()` | `mapToBalance()` |
| Generic error: `"Not supported"` | Specific: `"{methodName} is not supported"` |
| Network calls in `logic/` | Keep `logic/` pure, use `network/` for HTTP |
| Mock mainnet in integration tests | Use real mainnet with known addresses |

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in coin-multiversx
- Follow ALL rules exactly as documented
- When in doubt, check coin-filecoin as reference
- Prefer the more restrictive option when uncertain

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when architectural decisions change
- Review periodically for outdated rules

---

_Last Updated: 2026-01-29_
