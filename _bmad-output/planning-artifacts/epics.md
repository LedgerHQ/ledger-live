---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
status: complete
completedAt: '2026-01-29'
totalEpics: 5
totalStories: 28
totalFRsCovered: 31
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/product-brief-ledger-live-2026-01-29.md
---

# ledger-live - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ledger-live, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Balance & Account Information**
- FR1: API consumers can retrieve the native EGLD balance for any MultiversX address
- FR2: API consumers can retrieve all ESDT token balances for any MultiversX address
- FR3: API consumers can retrieve the account nonce (sequence) for any MultiversX address
- FR4: API returns `{ value: 0n, asset: { type: "native" } }` for accounts with no funds (never empty array)

**Operations & History**
- FR5: API consumers can list historical operations for any MultiversX address with pagination
- FR6: API consumers can retrieve both EGLD and ESDT token operations in a single query
- FR7: Operations are returned sorted by block height

**Staking & Delegation**
- FR8: API consumers can retrieve all delegation positions (stakes) for any MultiversX address
- FR9: API consumers can retrieve the list of available validators with APR, identity, and commission
- FR10: Delegation states are mapped to standardized `StakeState` enum (inactive, activating, active, deactivating)
- FR11: API throws "not supported" error for `getRewards()` (historical rewards not available)

**Transaction Crafting**
- FR12: API consumers can craft unsigned transactions for native EGLD transfers
- FR13: API consumers can craft unsigned transactions for ESDT token transfers using the `asset` field
- FR14: API consumers can craft unsigned transactions for all 6 delegation modes
- FR15: API consumers can combine an unsigned transaction with a signature to produce a signed transaction

**Transaction Broadcasting & Validation**
- FR16: API consumers can broadcast a signed transaction to the MultiversX network
- FR17: API consumers can estimate fees for a transaction intent
- FR18: API consumers can validate a transaction intent against balances and receive errors/warnings
- FR19: API throws "not supported" error for `craftRawTransaction()`

**Block Information**
- FR20: API consumers can retrieve the current block height via `lastBlock()`
- FR21: API throws "not supported" error for `getBlock()` and `getBlockInfo()`

**Developer Experience**
- FR22: Developers can import `createApi()` factory function from `@ledgerhq/coin-multiversx`
- FR23: Developers can configure the API with MultiversX-specific configuration options
- FR24: All public API functions have JSDoc documentation with parameter descriptions
- FR25: README includes `createApi()` usage examples and configuration documentation
- FR26: README includes migration guide for future maintainers

**Testing & Quality**
- FR27: All logic functions have unit tests with 100% coverage
- FR28: All API read methods have integration tests against real MultiversX mainnet
- FR29: Integration tests include edge cases (empty accounts, accounts with no history)
- FR30: `combine` method has integration tests with mock signatures
- FR31: Existing bridge tests continue to pass (no regressions)

### NonFunctional Requirements

**Integration**
- NFR1: API must work against MultiversX mainnet explorer endpoints
- NFR2: Network calls must handle standard HTTP errors gracefully
- NFR3: Must support the existing MultiversX explorer API data formats

**Code Quality**
- NFR4: 100% unit test coverage for all logic functions
- NFR5: All linting rules pass (`pnpm coin:multiversx lint`)
- NFR6: All type checks pass (`pnpm coin:multiversx typecheck`)
- NFR7: Integration tests pass against real MultiversX mainnet

**Reliability**
- NFR8: Integration tests are deterministic and repeatable
- NFR9: Tests use known mainnet addresses with predictable data
- NFR10: API gracefully handles network timeouts and errors

### Additional Requirements

**From Architecture Document:**

- **Reference Implementation**: Follow coin-filecoin as primary reference (already migrated to Alpaca API pattern)
- **Folder Structure**: Must follow `api/`, `logic/`, `network/`, `types/` structure
- **Type Parameters**: Use `MemoNotSupported` and `TxDataNotSupported` for the Api interface
- **Backward Compatibility**: API is purely additive; existing bridge implementation unchanged

**Architectural Decision Requirements (ADRs):**

- **ADR-001 (Data Transformation)**: Use dedicated mapper functions in `logic/` folder (`mapToBalance`, `mapToOperation`, `mapToStake`, `mapToValidator`)
- **ADR-002 (State Mapping)**: Use direct constant lookup object (`DELEGATION_STATE_MAP`) for delegation state mapping
- **ADR-003 (Error Handling)**: Throw generic `Error` with descriptive messages (format: `"{methodName} is not supported"`)
- **ADR-004 (Token Handling)**: Unified ESDT token handling with single code flow using `asset.type` discrimination
- **ADR-005 (Test Structure)**: All integration tests in single file `src/api/index.integ.test.ts`

**Naming Conventions:**

- Mapper functions: `mapTo{TargetType}` prefix (e.g., `mapToBalance`, `mapToOperation`)
- Chain-specific types: `MultiversX{TypeName}` prefix (e.g., `MultiversXAccountInfo`, `MultiversXDelegation`)
- JSDoc: Minimal - `@param` and `@returns` only

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/api/index.ts` | createApi() factory, all API methods |
| `src/api/index.test.ts` | Unit tests for API |
| `src/api/index.integ.test.ts` | Integration tests |
| `src/logic/mappers.ts` | Mapper functions |
| `src/logic/mappers.test.ts` | Mapper unit tests |
| `src/logic/stateMapping.ts` | State mapping constants |
| `src/logic/stateMapping.test.ts` | State mapping tests |
| `src/logic/index.ts` | Re-exports |

**Files to Modify:**

| File | Change |
|------|--------|
| `src/index.ts` | Add `export { createApi }` |
| `README.md` | Add createApi usage docs + migration guide |

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Native EGLD balance retrieval |
| FR2 | Epic 1 | ESDT token balances retrieval |
| FR3 | Epic 1 | Account nonce (sequence) retrieval |
| FR4 | Epic 1 | Empty account handling (0n, not empty array) |
| FR5 | Epic 2 | List operations with pagination |
| FR6 | Epic 2 | EGLD + ESDT operations in single query |
| FR7 | Epic 2 | Operations sorted by block height |
| FR8 | Epic 3 | Delegation positions (stakes) retrieval |
| FR9 | Epic 3 | Validators list with APR, identity, commission |
| FR10 | Epic 3 | Delegation state mapping to StakeState enum |
| FR11 | Epic 3 | getRewards() throws "not supported" |
| FR12 | Epic 4 | Craft native EGLD transfer transactions |
| FR13 | Epic 4 | Craft ESDT token transfer transactions |
| FR14 | Epic 4 | Craft all 6 delegation mode transactions |
| FR15 | Epic 4 | Combine unsigned transaction with signature |
| FR16 | Epic 4 | Broadcast signed transaction |
| FR17 | Epic 4 | Estimate fees for transaction intent |
| FR18 | Epic 4 | Validate transaction intent against balances |
| FR19 | Epic 4 | craftRawTransaction() throws "not supported" |
| FR20 | Epic 1 | lastBlock() retrieves current block height |
| FR21 | Epic 1 | getBlock()/getBlockInfo() throw "not supported" |
| FR22 | Epic 1 | createApi() factory import |
| FR23 | Epic 1 | API configuration options |
| FR24 | Epic 5 | JSDoc documentation |
| FR25 | Epic 5 | README with usage examples |
| FR26 | Epic 5 | Migration guide for maintainers |
| FR27 | Epic 5 | Unit tests with 100% coverage |
| FR28 | Epic 5 | Integration tests against mainnet |
| FR29 | Epic 5 | Edge case tests |
| FR30 | Epic 5 | Combine method integration tests |
| FR31 | Epic 5 | No bridge regressions |

## Epic List

| Epic | Title | FRs | User Value |
|------|-------|-----|------------|
| 1 | Core API & Account Queries | 8 | Balance & account queries working |
| 2 | Operations History | 3 | Complete transaction history |
| 3 | Staking & Delegation | 4 | Full staking visibility |
| 4 | Transaction Lifecycle | 8 | Full transaction operations |
| 5 | Documentation & Quality | 8 | Production-ready with confidence |

---

## Epic 1: Core API & Account Queries

**Goal:** Developers can create, configure, and use the MultiversX API for all account and balance queries (native EGLD + ESDT tokens).

**FRs Covered:** FR1, FR2, FR3, FR4, FR20, FR21, FR22, FR23

**User Value Delivered:**
- Import and configure `createApi()` from `@ledgerhq/coin-multiversx`
- Query native EGLD balance for any address
- Query all ESDT token balances
- Get account nonce/sequence
- Get current block height
- Proper empty account handling (returns `0n`, never empty array)

### Story 1.1: API Factory & Configuration

As a **Coin Module Developer**,
I want to import and configure `createApi()` from `@ledgerhq/coin-multiversx`,
So that I can start using the MultiversX API with my preferred configuration.

**Acceptance Criteria:**

**Given** a developer imports from `@ledgerhq/coin-multiversx`
**When** they call `createApi(config)`
**Then** they receive an `Api<MemoNotSupported, TxDataNotSupported>` object
**And** the API is configured with the provided MultiversX configuration options

**Given** a developer provides no configuration
**When** they call `createApi()` with default/empty config
**Then** the API uses default MultiversX mainnet explorer endpoints

**Given** the `src/api/index.ts` file is created
**When** a developer checks the package exports
**Then** `createApi` is exported from `@ledgerhq/coin-multiversx`

**Technical Notes:**
- Create `src/api/index.ts` with `createApi()` factory
- Create `src/logic/index.ts` for re-exports
- Update `src/index.ts` to export `createApi`
- Follow coin-filecoin reference implementation

---

### Story 1.2: Native EGLD Balance Query

As a **Coin Module Developer**,
I want to retrieve the native EGLD balance for any MultiversX address,
So that I can display account balances to users.

**Acceptance Criteria:**

**Given** a valid MultiversX address with EGLD funds
**When** I call `api.getBalance(address)`
**Then** I receive an array containing at least one `Balance` object with `asset.type === "native"` and the correct `value` as `bigint`

**Given** a valid MultiversX address with zero EGLD balance
**When** I call `api.getBalance(address)`
**Then** I receive `[{ value: 0n, asset: { type: "native" } }]`
**And** the array is never empty (FR4 compliance)

**Given** an invalid MultiversX address
**When** I call `api.getBalance(address)`
**Then** an error is thrown with a descriptive message

**Technical Notes:**
- Create `src/logic/mappers.ts` with `mapToBalance()` function
- Use existing `network/` layer for explorer communication
- Empty accounts must return `0n`, never empty array

---

### Story 1.3: ESDT Token Balance Query

As a **Coin Module Developer**,
I want to retrieve all ESDT token balances for any MultiversX address,
So that I can display complete portfolio information including all tokens.

**Acceptance Criteria:**

**Given** a MultiversX address holding multiple ESDT tokens
**When** I call `api.getBalance(address)`
**Then** I receive an array with native EGLD balance AND all ESDT token balances
**And** each ESDT balance has `asset.type === "esdt"` and `asset.assetReference` containing the token identifier

**Given** a MultiversX address with only native EGLD (no ESDT tokens)
**When** I call `api.getBalance(address)`
**Then** I receive only the native balance (no empty token entries)

**Given** a MultiversX address with ESDT tokens but zero EGLD
**When** I call `api.getBalance(address)`
**Then** I receive the native balance as `0n` AND all ESDT token balances

**Technical Notes:**
- Extend `mapToBalance()` to handle ESDT tokens
- Use `asset.type` discrimination (ADR-004)
- Token identifier stored in `asset.assetReference`

---

### Story 1.4: Account Sequence Query

As a **Coin Module Developer**,
I want to retrieve the account nonce (sequence) for any MultiversX address,
So that I can craft transactions with the correct sequence number.

**Acceptance Criteria:**

**Given** a valid MultiversX address with transaction history
**When** I call `api.getSequence(address)`
**Then** I receive the account nonce as a `bigint`

**Given** a new MultiversX address with no transactions
**When** I call `api.getSequence(address)`
**Then** I receive `0n` as the nonce

**Given** an invalid MultiversX address
**When** I call `api.getSequence(address)`
**Then** an error is thrown with a descriptive message

**Technical Notes:**
- Use existing `getAccountNonce` from network layer
- Return value as `bigint` per Api interface

---

### Story 1.5: Block Information & Unsupported Methods

As a **Coin Module Developer**,
I want to retrieve the current block height and receive clear errors for unsupported methods,
So that I understand what capabilities are available.

**Acceptance Criteria:**

**Given** the MultiversX network is accessible
**When** I call `api.lastBlock()`
**Then** I receive a `BlockInfo` object with the current block height

**Given** any valid parameters
**When** I call `api.getBlock()`
**Then** an error is thrown with message `"getBlock is not supported"`

**Given** any valid parameters
**When** I call `api.getBlockInfo()`
**Then** an error is thrown with message `"getBlockInfo is not supported"`

**Technical Notes:**
- Use existing `getBlockchainBlockHeight` from network layer
- Error format per ADR-003: `"{methodName} is not supported"`

---

## Epic 2: Operations History

**Goal:** Developers can retrieve complete transaction history with pagination for any MultiversX address.

**FRs Covered:** FR5, FR6, FR7

**User Value Delivered:**
- List historical operations with pagination
- Query both EGLD and ESDT operations in a single call
- Operations sorted by block height

### Story 2.1: List Operations with Pagination

As a **Coin Module Developer**,
I want to list historical operations for any MultiversX address with pagination support,
So that I can display transaction history efficiently without loading all data at once.

**Acceptance Criteria:**

**Given** a MultiversX address with transaction history
**When** I call `api.listOperations(address, { limit: 10 })`
**Then** I receive an array of up to 10 `Operation` objects

**Given** a MultiversX address with more transactions than the limit
**When** I call `api.listOperations(address, { limit: 10, offset: 10 })`
**Then** I receive the next page of operations starting from the 11th transaction

**Given** a MultiversX address with no transaction history
**When** I call `api.listOperations(address)`
**Then** I receive an empty array `[]`

**Given** an invalid MultiversX address
**When** I call `api.listOperations(address)`
**Then** an error is thrown with a descriptive message

**Technical Notes:**
- Create `mapToOperation()` in `src/logic/mappers.ts`
- Use existing network layer for transaction fetching
- Support standard pagination parameters (limit, offset)

---

### Story 2.2: EGLD and ESDT Operations

As a **Coin Module Developer**,
I want to retrieve both EGLD and ESDT token operations in a single query,
So that I can display a unified transaction history for the user.

**Acceptance Criteria:**

**Given** a MultiversX address with both EGLD and ESDT transactions
**When** I call `api.listOperations(address)`
**Then** I receive operations for both native EGLD transfers AND ESDT token transfers in the same array

**Given** an EGLD transfer operation
**When** the operation is mapped
**Then** it has `asset.type === "native"` and correct value/sender/receiver

**Given** an ESDT token transfer operation
**When** the operation is mapped
**Then** it has `asset.type === "esdt"`, `asset.assetReference` with token identifier, and correct value/sender/receiver

**Given** a MultiversX address with only EGLD transactions
**When** I call `api.listOperations(address)`
**Then** I receive only EGLD operations (no empty token entries)

**Technical Notes:**
- Extend `mapToOperation()` to handle both EGLD and ESDT
- Use `asset.type` discrimination (ADR-004)
- Merge EGLD and ESDT operations into single response

---

### Story 2.3: Operations Sorting

As a **Coin Module Developer**,
I want operations returned sorted by block height,
So that I can display transactions in chronological order.

**Acceptance Criteria:**

**Given** a MultiversX address with multiple transactions across different blocks
**When** I call `api.listOperations(address)`
**Then** operations are sorted by block height (most recent first or oldest first, consistently)

**Given** multiple transactions in the same block
**When** I call `api.listOperations(address)`
**Then** transactions within the same block maintain a consistent order

**Given** operations fetched with pagination
**When** I fetch page 1 and page 2
**Then** the combined results maintain proper block height ordering with no gaps or duplicates

**Technical Notes:**
- Sorting logic in `listOperations` implementation
- Ensure consistent sort order across paginated requests
- Document sort order (descending = most recent first)

---

## Epic 3: Staking & Delegation

**Goal:** Developers can query delegation positions and validator information with rich metadata.

**FRs Covered:** FR8, FR9, FR10, FR11

**User Value Delivered:**
- Retrieve all delegation positions (stakes) for any address
- Get list of validators with APR, identity, and commission
- Proper state mapping to standardized `StakeState` enum
- Clear "not supported" error for `getRewards()`

### Story 3.1: Delegation Positions Query

As a **Coin Module Developer**,
I want to retrieve all delegation positions (stakes) for any MultiversX address,
So that I can display the user's staking portfolio.

**Acceptance Criteria:**

**Given** a MultiversX address with active delegations
**When** I call `api.getStakes(address)`
**Then** I receive an array of `Stake` objects with delegation details (amount, validator, state)

**Given** a MultiversX address with multiple delegations to different validators
**When** I call `api.getStakes(address)`
**Then** I receive all delegation positions in the array

**Given** a MultiversX address with no delegations
**When** I call `api.getStakes(address)`
**Then** I receive an empty array `[]`

**Given** an invalid MultiversX address
**When** I call `api.getStakes(address)`
**Then** an error is thrown with a descriptive message

**Technical Notes:**
- Create `mapToStake()` in `src/logic/mappers.ts`
- Use existing `getAccountDelegations` from network layer
- Each stake includes validator address, delegated amount, and state

---

### Story 3.2: Delegation State Mapping

As a **Coin Module Developer**,
I want delegation states mapped to the standardized `StakeState` enum,
So that I can handle staking states consistently across different blockchains.

**Acceptance Criteria:**

**Given** a delegation in "staked" state on MultiversX
**When** the stake is mapped
**Then** the `state` field is `"active"`

**Given** a delegation in "unstaking" state on MultiversX
**When** the stake is mapped
**Then** the `state` field is `"deactivating"`

**Given** a delegation in "withdrawable" state on MultiversX
**When** the stake is mapped
**Then** the `state` field is `"inactive"`

**Given** a new delegation being activated
**When** the stake is mapped
**Then** the `state` field is `"activating"`

**Technical Notes:**
- Create `src/logic/stateMapping.ts` with `DELEGATION_STATE_MAP` constant
- Map all MultiversX delegation states to: `inactive`, `activating`, `active`, `deactivating`
- Use direct constant lookup object (ADR-002)

---

### Story 3.3: Validators List Query

As a **Coin Module Developer**,
I want to retrieve the list of available validators with APR, identity, and commission,
So that I can help users choose validators for delegation.

**Acceptance Criteria:**

**Given** the MultiversX network is accessible
**When** I call `api.getValidators()`
**Then** I receive an array of `Validator` objects

**Given** a validator with identity information
**When** the validator is mapped
**Then** the `Validator` object includes `name`, `address`, `apr`, and `commission`

**Given** a validator without identity information
**When** the validator is mapped
**Then** the `Validator` object has the address and numerical fields, with name as empty or address

**Given** multiple validators on the network
**When** I call `api.getValidators()`
**Then** I receive all active validators with their metadata

**Technical Notes:**
- Create `mapToValidator()` in `src/logic/mappers.ts`
- Use existing `getProviders` from network layer
- Include APR (annual percentage rate), identity (name), and commission rate

---

### Story 3.4: Unsupported Rewards Method

As a **Coin Module Developer**,
I want a clear error when calling `getRewards()`,
So that I understand this functionality is not available for MultiversX.

**Acceptance Criteria:**

**Given** any valid MultiversX address
**When** I call `api.getRewards(address)`
**Then** an error is thrown with message `"getRewards is not supported"`

**Given** developers checking API capabilities
**When** they attempt to use `getRewards()`
**Then** the error message clearly indicates the method is unsupported

**Technical Notes:**
- Error format per ADR-003: `"{methodName} is not supported"`
- Historical rewards data not available via MultiversX explorer API

---

## Epic 4: Transaction Lifecycle

**Goal:** Developers can craft, estimate fees, combine signatures, broadcast, and validate transactions for all supported operations.

**FRs Covered:** FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19

**User Value Delivered:**
- Craft unsigned transactions for native EGLD transfers
- Craft unsigned transactions for ESDT token transfers
- Craft unsigned transactions for all 6 delegation modes
- Estimate fees for any transaction intent
- Combine unsigned transaction with signature
- Broadcast signed transactions to network
- Validate transaction intents against balances

### Story 4.1: Craft Native EGLD Transactions

As a **Coin Module Developer**,
I want to craft unsigned transactions for native EGLD transfers,
So that I can prepare transactions for hardware wallet signing.

**Acceptance Criteria:**

**Given** a valid `TransactionIntent` for native EGLD transfer
**When** I call `api.craftTransaction(intent)`
**Then** I receive an unsigned transaction object ready for signing

**Given** an intent with `asset.type === "native"`
**When** the transaction is crafted
**Then** the transaction includes correct sender, receiver, value, and nonce

**Given** an intent with optional fee estimation
**When** I call `api.craftTransaction(intent, fees)`
**Then** the transaction uses the provided fee parameters

**Given** an invalid sender or receiver address
**When** I call `api.craftTransaction(intent)`
**Then** an error is thrown with a descriptive message

**Technical Notes:**
- Adapt existing `buildTransactionToSign` from bridge
- Return unsigned transaction in format expected by hardware wallet
- Include gas limit and gas price in transaction

---

### Story 4.2: Craft ESDT Token Transactions

As a **Coin Module Developer**,
I want to craft unsigned transactions for ESDT token transfers,
So that I can send any MultiversX token through the API.

**Acceptance Criteria:**

**Given** a valid `TransactionIntent` with `asset.type === "esdt"`
**When** I call `api.craftTransaction(intent)`
**Then** I receive an unsigned transaction with correct ESDT transfer encoding

**Given** an ESDT transfer intent
**When** the transaction is crafted
**Then** the transaction data field contains the proper ESDT transfer function call and token identifier

**Given** an ESDT intent with `asset.assetReference` containing token identifier
**When** the transaction is crafted
**Then** the token identifier from `assetReference` is used in the transaction

**Given** an invalid or non-existent token identifier
**When** I call `api.craftTransaction(intent)`
**Then** the transaction is still crafted (validation happens on-chain or via `validateIntent`)

**Technical Notes:**
- Use unified code flow with `asset.type` discrimination (ADR-004)
- ESDT transfer uses special data encoding per MultiversX protocol
- Token identifier format: `TOKEN-abc123`

---

### Story 4.3: Craft Delegation Transactions

As a **Coin Module Developer**,
I want to craft unsigned transactions for all 6 delegation modes,
So that I can support the full staking lifecycle.

**Acceptance Criteria:**

**Given** a delegation intent for "delegate" mode
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to delegate EGLD to a validator

**Given** a delegation intent for "undelegate" mode
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to undelegate from a validator

**Given** a delegation intent for "withdraw" mode
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to withdraw undelegated funds

**Given** a delegation intent for "claimRewards" mode
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to claim pending rewards

**Given** a delegation intent for "reDelegateRewards" mode
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to re-delegate rewards

**Given** a delegation intent for "changeValidator" mode (if supported)
**When** I call `api.craftTransaction(intent)`
**Then** I receive a transaction to move delegation to another validator

**Technical Notes:**
- All 6 delegation modes from existing bridge implementation
- Each mode has specific smart contract call data
- Validator address required for delegate/undelegate operations

---

### Story 4.4: Fee Estimation

As a **Coin Module Developer**,
I want to estimate fees for any transaction intent,
So that I can display expected costs to users before signing.

**Acceptance Criteria:**

**Given** a valid `TransactionIntent` for native transfer
**When** I call `api.estimateFees(intent)`
**Then** I receive a `FeeEstimation` object with gas-based fee calculation

**Given** a valid `TransactionIntent` for ESDT transfer
**When** I call `api.estimateFees(intent)`
**Then** I receive fees reflecting the higher gas cost of token transfers

**Given** a valid `TransactionIntent` for delegation
**When** I call `api.estimateFees(intent)`
**Then** I receive fees reflecting the smart contract interaction cost

**Given** the current network gas price
**When** fees are estimated
**Then** the estimation uses current network parameters

**Technical Notes:**
- Return `FeeEstimation` with gas limit, gas price, and total fee
- Different transaction types have different gas requirements
- Use network API to get current gas price if needed

---

### Story 4.5: Combine Transaction with Signature

As a **Coin Module Developer**,
I want to combine an unsigned transaction with a signature,
So that I can produce a signed transaction ready for broadcast.

**Acceptance Criteria:**

**Given** an unsigned transaction from `craftTransaction`
**When** I call `api.combine(unsignedTx, signature)`
**Then** I receive a signed transaction ready for broadcasting

**Given** a valid signature from hardware wallet
**When** combined with the unsigned transaction
**Then** the resulting transaction includes the signature in the correct format

**Given** an invalid or malformed signature
**When** I call `api.combine(unsignedTx, signature)`
**Then** the combination still proceeds (validation happens on broadcast)

**Technical Notes:**
- New implementation specific to Alpaca API
- Signature format per MultiversX protocol
- Output format compatible with `broadcast` method

---

### Story 4.6: Broadcast Transaction

As a **Coin Module Developer**,
I want to broadcast a signed transaction to the MultiversX network,
So that I can submit transactions on behalf of users.

**Acceptance Criteria:**

**Given** a valid signed transaction
**When** I call `api.broadcast(signedTx)`
**Then** I receive the transaction hash upon successful submission

**Given** a transaction that the network rejects
**When** I call `api.broadcast(signedTx)`
**Then** an error is thrown with the rejection reason

**Given** a network timeout or connectivity issue
**When** I call `api.broadcast(signedTx)`
**Then** an error is thrown with a descriptive message (NFR10 compliance)

**Technical Notes:**
- Wrap existing `submit` function from network layer
- Return transaction hash as string
- Handle network errors gracefully

---

### Story 4.7: Validate Transaction Intent

As a **Coin Module Developer**,
I want to validate a transaction intent against account balances,
So that I can warn users about issues before they sign.

**Acceptance Criteria:**

**Given** a valid intent with sufficient balance
**When** I call `api.validateIntent(intent, balances)`
**Then** I receive a `TransactionValidation` with no errors

**Given** an intent where the sender has insufficient EGLD for transfer + fees
**When** I call `api.validateIntent(intent, balances)`
**Then** I receive a validation with an error indicating insufficient balance

**Given** an ESDT intent where the sender lacks the specified token
**When** I call `api.validateIntent(intent, balances)`
**Then** I receive a validation with an error indicating missing token balance

**Given** an intent with optional fees parameter
**When** I call `api.validateIntent(intent, balances, fees)`
**Then** validation includes the provided fee amount in balance calculations

**Technical Notes:**
- Adapt existing `getTransactionStatus` logic
- Return `TransactionValidation` with errors and warnings arrays
- Check both native balance (for fees) and asset balance (for transfer)

---

### Story 4.8: Unsupported Raw Transaction Method

As a **Coin Module Developer**,
I want a clear error when calling `craftRawTransaction()`,
So that I understand this functionality is not needed for MultiversX.

**Acceptance Criteria:**

**Given** any parameters
**When** I call `api.craftRawTransaction()`
**Then** an error is thrown with message `"craftRawTransaction is not supported"`

**Technical Notes:**
- Error format per ADR-003: `"{methodName} is not supported"`
- MultiversX uses structured transaction format, not raw bytes

---

## Epic 5: Documentation & Quality Assurance

**Goal:** Developers have complete documentation and confidence that the API works correctly through comprehensive test coverage.

**FRs Covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31

**User Value Delivered:**
- JSDoc documentation for all public functions
- README with `createApi()` usage examples
- Migration guide for future maintainers
- 100% unit test coverage for logic functions
- Integration tests against real MultiversX mainnet
- Edge case coverage (empty accounts, no history)
- No regressions in existing bridge tests

### Story 5.1: JSDoc Documentation

As a **Coin Module Developer**,
I want all public API functions documented with JSDoc,
So that I can understand function parameters and return values directly in my IDE.

**Acceptance Criteria:**

**Given** any public function in `src/api/index.ts`
**When** a developer hovers over or inspects the function
**Then** they see JSDoc with `@param` descriptions and `@returns` documentation

**Given** the `createApi()` factory function
**When** documented
**Then** JSDoc explains the config parameter and return type

**Given** each API method (getBalance, listOperations, etc.)
**When** documented
**Then** JSDoc explains parameters, return value, and any thrown errors

**Given** mapper functions in `src/logic/mappers.ts`
**When** documented
**Then** JSDoc explains input type and output transformation

**Technical Notes:**
- Minimal JSDoc: `@param` and `@returns` only (per architecture)
- No excessive documentation or examples in JSDoc
- TypeScript types handle type information

---

### Story 5.2: README Usage Documentation

As a **Coin Module Developer**,
I want README documentation with `createApi()` usage examples,
So that I can quickly understand how to integrate the API.

**Acceptance Criteria:**

**Given** a developer opening the coin-multiversx README
**When** they look for API usage
**Then** they find a clear section explaining `createApi()` configuration and usage

**Given** the usage documentation
**When** a developer follows the examples
**Then** they can successfully create and use the API

**Given** different configuration options
**When** documented
**Then** each option is explained with its purpose and default value

**Given** example code in README
**When** copied and used
**Then** the code compiles and runs correctly

**Technical Notes:**
- Update existing `README.md` with new API section
- Include import statement and basic usage
- Show configuration options

---

### Story 5.3: Migration Guide

As a **Coin Module Developer**,
I want a migration guide for future maintainers,
So that others can understand how to migrate similar coins to the Alpaca API pattern.

**Acceptance Criteria:**

**Given** a developer assigned to migrate another coin module
**When** they read the migration guide in README
**Then** they understand the step-by-step process

**Given** the migration guide
**When** it references the implementation
**Then** it points to specific files and patterns used

**Given** common migration challenges
**When** documented
**Then** the guide explains how they were solved in coin-multiversx

**Given** reference implementations mentioned
**When** a developer checks them
**Then** coin-filecoin and other references are correctly cited

**Technical Notes:**
- Add "Migration Guide" section to README
- Reference coin-filecoin as primary pattern
- Document folder structure and key decisions

---

### Story 5.4: Logic Function Unit Tests

As a **QA/Test Engineer**,
I want 100% unit test coverage for all logic functions,
So that I have confidence in the core business logic.

**Acceptance Criteria:**

**Given** `mapToBalance()` function
**When** unit tests run
**Then** all code paths are covered (native only, native + tokens, empty account)

**Given** `mapToOperation()` function
**When** unit tests run
**Then** all operation types are tested (EGLD, ESDT, various transaction types)

**Given** `mapToStake()` function
**When** unit tests run
**Then** all delegation states are tested

**Given** `mapToValidator()` function
**When** unit tests run
**Then** validators with and without identity are tested

**Given** `DELEGATION_STATE_MAP` constant
**When** unit tests run
**Then** all state mappings are verified

**Given** Jest coverage report
**When** run for `src/logic/`
**Then** coverage is 100% for statements, branches, functions, and lines

**Technical Notes:**
- Create `src/logic/mappers.test.ts`
- Create `src/logic/stateMapping.test.ts`
- Use Jest for testing (monorepo standard)
- Test pure functions with various input scenarios

---

### Story 5.5: API Integration Tests

As a **QA/Test Engineer**,
I want integration tests for all API read methods against real MultiversX mainnet,
So that I can verify the API works correctly with real network data.

**Acceptance Criteria:**

**Given** `getBalance` method
**When** integration test runs against mainnet
**Then** it successfully retrieves balance for a known address

**Given** `listOperations` method
**When** integration test runs against mainnet
**Then** it successfully retrieves operations for an address with history

**Given** `getStakes` method
**When** integration test runs against mainnet
**Then** it successfully retrieves delegations for a staking address

**Given** `getValidators` method
**When** integration test runs against mainnet
**Then** it successfully retrieves the validator list

**Given** `lastBlock` method
**When** integration test runs against mainnet
**Then** it successfully retrieves current block height

**Given** `getSequence` method
**When** integration test runs against mainnet
**Then** it successfully retrieves account nonce

**Technical Notes:**
- All tests in single file `src/api/index.integ.test.ts` (ADR-005)
- Use known mainnet addresses with predictable data (NFR9)
- Tests must be deterministic and repeatable (NFR8)
- Exclude `broadcast` from integration tests

---

### Story 5.6: Edge Case Integration Tests

As a **QA/Test Engineer**,
I want integration tests covering edge cases,
So that I can verify the API handles unusual scenarios correctly.

**Acceptance Criteria:**

**Given** an empty account (no balance, no history)
**When** `getBalance` is called
**Then** it returns `[{ value: 0n, asset: { type: "native" } }]` (not empty array)

**Given** an account with no transaction history
**When** `listOperations` is called
**Then** it returns an empty array without error

**Given** an account with no delegations
**When** `getStakes` is called
**Then** it returns an empty array without error

**Given** a very active account with many transactions
**When** `listOperations` is called with pagination
**Then** pagination works correctly across multiple pages

**Technical Notes:**
- Add edge case tests to `src/api/index.integ.test.ts`
- Use real mainnet addresses representing each edge case
- Document test addresses in comments

---

### Story 5.7: Combine Method Integration Tests

As a **QA/Test Engineer**,
I want integration tests for the `combine` method with mock signatures,
So that I can verify transaction combination works correctly.

**Acceptance Criteria:**

**Given** an unsigned transaction from `craftTransaction`
**When** combined with a mock signature
**Then** the result is a properly formatted signed transaction

**Given** a native EGLD transaction
**When** combined with a signature
**Then** the signed transaction has correct structure

**Given** an ESDT token transaction
**When** combined with a signature
**Then** the signed transaction preserves token data

**Given** the combined transaction
**When** inspected
**Then** it contains the original transaction data plus signature

**Technical Notes:**
- Add combine tests to `src/api/index.integ.test.ts`
- Use mock signatures (real signatures require hardware wallet)
- Verify transaction structure without broadcasting

---

### Story 5.8: Bridge Regression Tests

As a **QA/Test Engineer**,
I want existing bridge tests to continue passing,
So that I can confirm the API addition doesn't break existing functionality.

**Acceptance Criteria:**

**Given** all existing bridge unit tests
**When** test suite runs
**Then** all tests pass with no failures

**Given** all existing bridge integration tests (if any)
**When** test suite runs
**Then** all tests pass with no failures

**Given** the bridge implementation
**When** API is added
**Then** bridge code remains unchanged (API is additive)

**Given** bridge exports from package
**When** checked
**Then** all existing exports still work

**Technical Notes:**
- Run `pnpm coin:multiversx test` and verify no regressions
- Bridge files in `src/bridge/` remain unchanged
- New API is purely additive

---

## Summary

| Epic | Title | Stories | FRs Covered |
|------|-------|---------|-------------|
| 1 | Core API & Account Queries | 5 | FR1, FR2, FR3, FR4, FR20, FR21, FR22, FR23 |
| 2 | Operations History | 3 | FR5, FR6, FR7 |
| 3 | Staking & Delegation | 4 | FR8, FR9, FR10, FR11 |
| 4 | Transaction Lifecycle | 8 | FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19 |
| 5 | Documentation & Quality | 8 | FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31 |
| **Total** | | **28 stories** | **31 FRs** |
