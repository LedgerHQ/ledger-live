---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
classification:
  projectType: developer_tool
  domain: fintech
  complexity: high
  projectContext: brownfield
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-ledger-live-2026-01-29.md
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture-desktop.md
  - docs/architecture-mobile.md
  - docs/architecture-libraries.md
  - docs/integration-architecture.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/contribution-guide.md
  - docs/testing-guide.md
  - docs/source-tree-analysis.md
documentCounts:
  briefs: 1
  research: 0
  projectDocs: 11
workflowType: 'prd'
date: 2026-01-29
author: Hedi.edelbloute
---

# Product Requirements Document - ledger-live

**Author:** Hedi.edelbloute  
**Date:** 2026-01-29  
**Project:** Alpaca API for coin-multiversx

---

## Executive Summary

### Vision

Implement the standardized **Alpaca API** for the `coin-multiversx` module, enabling MultiversX blockchain integration through the `Api` interface defined in `@ledgerhq/coin-framework`. This modernizes the module architecture, enables Alpaca backend service integration, and establishes proper test coverage.

### Product Differentiator

- **Full Feature Parity:** Every capability in the current bridge is exposed through the API—including ESDT tokens and all 6 delegation modes
- **Proven Pattern:** Follows the exact architecture from successful migrations (Filecoin, XRP, Stellar, Tezos, Tron)
- **Comprehensive Staking:** Implements `getStakes()` and `getValidators()` with rich metadata (APR, identity, commission)
- **Backward Compatible:** Existing bridge continues working unchanged; API is purely additive
- **Test-First Quality:** Integration tests against real MultiversX network ensure API correctness

### Target Users

| User | Need |
|------|------|
| **Coin Module Developer** | Familiar structure, testable code, pattern consistency |
| **Alpaca Service Engineer** | Standard `createApi()` integration, no special handling |
| **QA/Test Engineer** | Integration tests against real mainnet, comprehensive coverage |

---

## Success Criteria

### User Success

**For Coin Module Developers:**
- Can understand the `coin-multiversx` module structure within **30 minutes** because it matches familiar patterns (coin-filecoin, coin-algorand)
- Can confidently make changes with good test coverage backing them
- Integration tests run **green on first try** after following the established patterns

**For Alpaca Service Engineers:**
- Can deploy `coin-multiversx` to `alpaca-coin-module` service using the same pattern as other coins
- All endpoints respond correctly with **no special handling needed**—MultiversX becomes "just another coin"

**For QA/Test Engineers:**
- Can run `pnpm test-integ` with confidence that `getBalance`, `listOperations`, `getStakes`, and `getValidators` work against real MultiversX mainnet

### Business Success

- Architecture alignment achieved: coin-multiversx follows the modernized Alpaca API pattern
- Reduced maintenance burden through consistent code structure across coin modules
- Enables Alpaca backend service to expose MultiversX capabilities

### Technical Success

| Metric | Target |
|--------|--------|
| Unit test coverage (logic functions) | 100% |
| Integration test pass rate | 100% |
| API methods implemented | 14/14 |
| Bridge regression tests | 0 failures |
| Existing bridge functionality | Unchanged (API is additive) |

**Behavioral Requirements Met:**
- Empty account handling: `getBalance()` returns `[{ value: 0n, asset: { type: "native" } }]`, never empty array
- ESDT token support: `craftTransaction()` handles `asset.type === "esdt"` correctly
- Delegation state mapping: `getStakes()` correctly maps MultiversX delegation states to `StakeState` enum

### Measurable Outcomes

| Outcome | Measurement |
|---------|-------------|
| API completeness | All 14 methods implemented per spec |
| Code quality | 100% Jest coverage report for `logic/` |
| Integration correctness | CI pipeline `test-integ` job passes |
| Backward compatibility | Existing bridge tests pass |
| Documentation | JSDoc complete, README updated |

---

## Product Scope

### MVP - Minimum Viable Product

1. **API Implementation** - `createApi(config)` factory returning full `Api<MemoNotSupported, TxDataNotSupported>`
2. **ESDT Token Support** - Balance, operations, and transaction crafting for ESDT tokens
3. **Delegation Support** - `getStakes()` and `getValidators()` with APR, identity, commission
4. **Testing** - 100% unit coverage + integration tests against real MultiversX mainnet
5. **Documentation** - Inline JSDoc + README with `createApi()` usage

### Post-MVP (Phase 2)

- **Coin-Tester Module:** Implement `coin-tester-multiversx` for end-to-end transaction scenarios with local/testnet node

### Vision (Future)

- Guarded account support
- Additional delegation modes (if added to MultiversX)
- Reference implementation status for coins with staking + tokens

---

## User Journeys

### Journey 1: Marcus, the Coin Module Developer

**Persona:** Marcus is a senior engineer on the Ledger Live Coin Integration team. He maintains 8 different coin modules and switches between them weekly. He's been with the team for 2 years but has never deeply worked on MultiversX.

**Opening Scene:**
Marcus gets assigned to add a feature to `coin-multiversx`—support for a new ESDT token operation. He opens the module and immediately feels lost. The logic is scattered across bridge files, there's no clear `api/` folder like he's used to from coin-filecoin, and he can't find isolated logic functions to test. He sighs, knowing this will take longer than it should.

**Rising Action:**
After the Alpaca API migration, Marcus opens `coin-multiversx` again. He sees the familiar structure: `api/`, `logic/`, `bridge/`. He opens `api/index.ts` and finds `createApi()` exactly where he expects it. The JSDoc comments explain each method. He navigates to `logic/` and finds pure functions he can unit test in isolation.

**Climax:**
Marcus writes his new feature, adds unit tests for the logic function, runs `pnpm test-integ`—and everything passes on the first try. He didn't have to ask anyone how MultiversX works internally.

**Resolution:**
Marcus submits his PR with confidence. The code review is smooth because reviewers recognize the pattern. He finishes the task in 2 hours instead of the full day he'd budgeted. He now uses coin-multiversx as a reference when explaining staking + token patterns to new team members.

**Capabilities Revealed:** Clear folder structure, isolated logic functions, comprehensive test coverage, JSDoc documentation, pattern consistency with other coins.

---

### Journey 2: Priya, the Alpaca Service Engineer

**Persona:** Priya operates the `alpaca-coin-module` service that exposes coin APIs as REST endpoints. She's added 15 coins to the service and knows the deployment pattern by heart.

**Opening Scene:**
Priya receives a request: "Add MultiversX to alpaca-coin-module." She checks the coin-multiversx package and finds... no `createApi()` function. The module has a `MultiversXApi` class in `apiCalls.ts` but it doesn't implement the standard `Api` interface. She'll need to write a custom adapter or wait for the team to refactor it.

**Rising Action:**
After the migration, Priya revisits the request. She imports `createApi` from `@ledgerhq/coin-multiversx`, passes the config object, and wires it into the service—the same three lines of code she uses for every other coin.

**Climax:**
She deploys to staging. All endpoints respond correctly: `/balance`, `/operations`, `/stakes`, `/validators`. The health checks pass. No custom handling required.

**Resolution:**
MultiversX is live in alpaca-coin-module within an hour. When the monitoring dashboard shows healthy metrics, Priya closes the ticket and moves on. MultiversX is now just another coin in the service—exactly how it should be.

**Capabilities Revealed:** Standard `Api` interface implementation, `createApi()` factory function, consistent behavior across all endpoints, no special handling needed.

---

### Journey 3: Tomás, the QA/Test Engineer

**Persona:** Tomás ensures coin modules work correctly before release. He writes and maintains integration tests, and he's been frustrated by inconsistent test coverage across modules.

**Opening Scene:**
Tomás needs to validate that MultiversX delegation queries work correctly. He looks for integration tests but finds only scattered unit tests mocking the entire bridge layer. To verify real behavior, he'd have to manually test against mainnet—tedious and error-prone.

**Rising Action:**
After the migration, Tomás opens `src/api/index.integ.test.ts`. He sees comprehensive tests for `getBalance`, `listOperations`, `getStakes`, and `getValidators`—all running against real MultiversX mainnet with known test addresses.

**Climax:**
Tomás runs `pnpm test-integ`. Green checkmarks across the board. He adds a new test case for an edge scenario (empty account), and it slots right into the existing test structure.

**Resolution:**
Tomás has confidence that the API works against the real network. When a bug report comes in about delegation state mapping, he can write a regression test immediately. The module finally has the test coverage it deserves.

**Capabilities Revealed:** Integration tests against real network, test structure matching other coins, edge case coverage, easy test addition.

---

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|---------------------------|
| **Coin Module Developer** | Familiar folder structure (`api/`, `logic/`, `bridge/`), pure testable logic functions, JSDoc documentation, pattern consistency |
| **Alpaca Service Engineer** | `createApi()` factory, standard `Api` interface, consistent endpoint behavior, no special handling |
| **QA/Test Engineer** | Integration tests against real mainnet, comprehensive method coverage, easy test extension, edge case support |

---

## Domain-Specific Requirements

### Security & Transaction Safety

- Transaction signing happens on hardware device (out of scope for this API layer)
- API handles unsigned transaction crafting and broadcasting of signed transactions
- No private keys touched by this code—security boundary is clear

### Architecture Constraints

- Must implement `Api` interface from `@ledgerhq/coin-framework/api/types.ts`
- Must follow established folder structure: `api/`, `logic/`, `bridge/`
- Must maintain backward compatibility with existing bridge implementation
- API is additive—existing bridge functionality continues unchanged

### Testing Requirements

- Integration tests must run against **real MultiversX mainnet** (not mocked)
- Broadcast testing excluded from integration tests (requires real signatures from hardware)
- Coin-tester module for full end-to-end testing deferred to post-MVP

### Data Handling

- Account addresses: public blockchain data, not sensitive
- Balance and operation data: public blockchain data
- No PII or sensitive user data handled at this layer
- All data sourced from public MultiversX explorer APIs

---

## Developer Tool Specific Requirements

### Project-Type Overview

**Type:** TypeScript Library / Coin Module  
**Context:** Internal package within `@ledgerhq/ledger-live` monorepo  
**Consumers:** Coin Module Developers, Alpaca Service Engineers, QA Engineers

### Technical Architecture Considerations

**Runtime Environment:**
- TypeScript 5.4.3 (monorepo standard)
- Node.js (managed by proto toolchain)
- pnpm 10.24.0 workspace

**Package Structure:**
```
libs/coin-modules/coin-multiversx/
├── src/
│   ├── api/                    # New Alpaca API implementation
│   │   ├── index.ts            # createApi() factory
│   │   ├── index.test.ts       # Unit tests
│   │   └── index.integ.test.ts # Integration tests
│   ├── logic/                  # Pure business logic functions
│   ├── network/                # Explorer/node communication
│   ├── bridge/                 # Existing bridge (unchanged)
│   ├── types/                  # Type definitions
│   └── config.ts               # Chain configuration
├── package.json
└── tsconfig.json
```

**API Surface:**
- Implements standard `Api<MemoNotSupported, TxDataNotSupported>` interface
- No MultiversX-specific extensions to the interface
- Factory function: `createApi(config: MultiversXConfig): Api`

### Documentation Requirements

**Inline Documentation:**
- JSDoc comments for all public API functions
- Parameter descriptions with types
- Return value documentation
- Example usage in complex methods

**README Updates:**
- `createApi()` usage and configuration
- Reference implementations for pattern guidance:
  - `coin-filecoin`, `coin-xrp`, `coin-evm`, `coin-stellar`, `coin-tezos`, `coin-tron`

**Migration Guide (in README):**
- "How to migrate from bridge to API" section for future maintainers
- Step-by-step guidance based on proven migration pattern

### Reference Implementations

| Coin Module | Key Patterns to Reference |
|-------------|---------------------------|
| `coin-filecoin` | Primary reference for API structure, integration tests |
| `coin-xrp` | Simple token handling patterns |
| `coin-evm` | Complex multi-network patterns |
| `coin-stellar` | Memo handling patterns |
| `coin-tezos` | Delegation/staking patterns |
| `coin-tron` | Token (TRC20) handling similar to ESDT |

### Implementation Considerations

**Build & Test Commands:**
```bash
pnpm coin:multiversx test        # Unit tests
pnpm coin:multiversx test-integ  # Integration tests (real network)
pnpm coin:multiversx typecheck   # Type checking
pnpm coin:multiversx lint        # Linting
```

**Scope Boundary:**
- Expose `createApi()` from `coin-multiversx` package
- Existing bridge exports unchanged for backward compatibility
- **No registration in `ledger-live-common`** required for MVP

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP  
The minimum implementation that enables Alpaca backend integration and establishes the standardized pattern for coin-multiversx.

**Resource Model:** Parallelizable work  
Different API methods can be developed concurrently by separate developers:
- Balance & operations track
- Staking track (getStakes, getValidators)
- Transaction track (craftTransaction, broadcast, combine)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- ✅ Coin Module Developer: Familiar structure, testable code
- ✅ Alpaca Service Engineer: Standard `createApi()` integration
- ✅ QA/Test Engineer: Integration tests against real network

**Must-Have Capabilities:**

| Category | Methods |
|----------|---------|
| **Balance & Operations** | `getBalance`, `listOperations` |
| **Staking** | `getStakes`, `getValidators` |
| **Transaction** | `craftTransaction`, `estimateFees`, `combine`, `broadcast` |
| **Account** | `getSequence`, `lastBlock` |
| **Validation** | `validateIntent` |
| **Not Supported** | `getRewards`, `craftRawTransaction`, `getBlock`, `getBlockInfo` (throw error) |

**ESDT Token Support:** Full support in `getBalance`, `listOperations`, `craftTransaction`

**Delegation Support:** All 6 delegation modes mapped to `Stake[]` and `Validator[]`

**Testing:** 100% unit coverage + integration tests against real MultiversX mainnet

**Documentation:** JSDoc inline + README with migration guide

### Post-MVP Features

**Phase 2: Coin-Tester Module**
- Implement `coin-tester-multiversx`
- End-to-end transaction scenarios with local/testnet node
- Validate `broadcast` functionality with real signatures

**Vision (Future):**
- Guarded account support
- Additional delegation modes (if added to MultiversX)
- Reference implementation status for staking + token coins

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|------------|
| ESDT token encoding in `craftTransaction` | Reference existing bridge implementation; integration tests validate correctness |
| Delegation state mapping | Use existing `getAccountDelegations` logic; map to standardized `StakeState` enum |

**Resource Risks:**

| Risk | Mitigation |
|------|------------|
| Developer availability | Work is parallelizable across API method tracks |
| Knowledge gaps | Reference implementations available (coin-filecoin, coin-tron, etc.) |

**No bridge refactoring risk:** API is purely additive; existing bridge unchanged.

---

## Functional Requirements

### Balance & Account Information

- **FR1:** API consumers can retrieve the native EGLD balance for any MultiversX address
- **FR2:** API consumers can retrieve all ESDT token balances for any MultiversX address
- **FR3:** API consumers can retrieve the account nonce (sequence) for any MultiversX address
- **FR4:** API returns `{ value: 0n, asset: { type: "native" } }` for accounts with no funds (never empty array)

### Operations & History

- **FR5:** API consumers can list historical operations for any MultiversX address with pagination
- **FR6:** API consumers can retrieve both EGLD and ESDT token operations in a single query
- **FR7:** Operations are returned sorted by block height

### Staking & Delegation

- **FR8:** API consumers can retrieve all delegation positions (stakes) for any MultiversX address
- **FR9:** API consumers can retrieve the list of available validators with APR, identity, and commission
- **FR10:** Delegation states are mapped to standardized `StakeState` enum (inactive, activating, active, deactivating)
- **FR11:** API throws "not supported" error for `getRewards()` (historical rewards not available)

### Transaction Crafting

- **FR12:** API consumers can craft unsigned transactions for native EGLD transfers
- **FR13:** API consumers can craft unsigned transactions for ESDT token transfers using the `asset` field
- **FR14:** API consumers can craft unsigned transactions for all 6 delegation modes
- **FR15:** API consumers can combine an unsigned transaction with a signature to produce a signed transaction

### Transaction Broadcasting & Validation

- **FR16:** API consumers can broadcast a signed transaction to the MultiversX network
- **FR17:** API consumers can estimate fees for a transaction intent
- **FR18:** API consumers can validate a transaction intent against balances and receive errors/warnings
- **FR19:** API throws "not supported" error for `craftRawTransaction()`

### Block Information

- **FR20:** API consumers can retrieve the current block height via `lastBlock()`
- **FR21:** API throws "not supported" error for `getBlock()` and `getBlockInfo()`

### Developer Experience

- **FR22:** Developers can import `createApi()` factory function from `@ledgerhq/coin-multiversx`
- **FR23:** Developers can configure the API with MultiversX-specific configuration options
- **FR24:** All public API functions have JSDoc documentation with parameter descriptions
- **FR25:** README includes `createApi()` usage examples and configuration documentation
- **FR26:** README includes migration guide for future maintainers

### Testing & Quality

- **FR27:** All logic functions have unit tests with 100% coverage
- **FR28:** All API read methods have integration tests against real MultiversX mainnet
- **FR29:** Integration tests include edge cases (empty accounts, accounts with no history)
- **FR30:** `combine` method has integration tests with mock signatures
- **FR31:** Existing bridge tests continue to pass (no regressions)

---

## Non-Functional Requirements

### Integration

- **NFR1:** API must work against MultiversX mainnet explorer endpoints
- **NFR2:** Network calls must handle standard HTTP errors gracefully
- **NFR3:** Must support the existing MultiversX explorer API data formats

### Code Quality

- **NFR4:** 100% unit test coverage for all logic functions
- **NFR5:** All linting rules pass (`pnpm coin:multiversx lint`)
- **NFR6:** All type checks pass (`pnpm coin:multiversx typecheck`)
- **NFR7:** Integration tests pass against real MultiversX mainnet

### Reliability

- **NFR8:** Integration tests are deterministic and repeatable
- **NFR9:** Tests use known mainnet addresses with predictable data
- **NFR10:** API gracefully handles network timeouts and errors
