
# Study on Account Balance Freshness Strategy

## Context / Issue

Users currently must wait for complete account synchronization to see updated balance information. 

This creates a slow user experience, especially for users with multiple accounts who need immediate access to balance information.

We will study a first improvement iteration by looking at how we could get the balance more quickly.
We will look at tradeoff between working in existing work and achieving a performant result.

### A more technical look

The current `AccountBridge` architecture performs full synchronization (balance, operations,...).

This is done by the `AccountBridge#sync` method which takes current Account and result a new consistent Account state. In this Account state we currently have everything (balance, operations, ...) collocated.

Today, notably in Ledger Live Mobile we will schedule synchronisations sequentially with a maximum of 4 concurrent syncs (`SYNC_MAX_CONCURRENT`).

## Steps

### Step 1: the balance emitted from the existing AccountBridge#sync

Extend the current `SyncConfig` with an early balance callback mechanism:

```typescript
type AccountBalance {
  id: string,
  balance: BigNumber
  // Note: spendableBalance could be added later for more complete balance info
}
interface SyncConfig {
  paginationConfig: PaginationConfig;
  blacklistedTokenIds?: string[];
  onBalancesUpdate?: (balances: AccountBalance[]) => void; // NEW
}
```

**Implementation:** 
- No `AccountBridge` interface changes
- Balance emitted during `getAccountShape` execution: almost free for coin to implement it.
- UI uses a local redux cache that would contains "sync optimistic" balance state which eventually reconciliates at end of sync. In the minimal form, this state is exclusively here for the UI and is not persisted (tradeoff: we could assume users eventually reach full sync and that `account.balance` meet that optimistic balance value).
- Backward compatible in both ways (necessary in case we want to revert)

### Step 2: Dedicated Balance Method (Hybrid Approach)

Add a dedicated `getBalances` method to the `AccountBridge` interface while also implementing the Step 1 callback mechanism:

```typescript
interface AccountBridge<T> extends SendReceiveAccountBridge<T> {
  getBalances?(mainAccount: Account): Promise<AccountBalance[]>; // NEW
}

// Also extends SyncConfig from Step 1:
interface SyncConfig {
  paginationConfig: PaginationConfig;
  blacklistedTokenIds?: string[];
  onBalancesUpdate?: (balances: AccountBalance[]) => void; // From Step 1
}
```

**Implementation:**
- New optional bridge method for immediate balance retrieval
- a bit more work for coins to adapt an implementation but trivial in alpaca
- **PLUS** full sync also emits balance updates via `onBalancesUpdate` callback
- Single source of truth: all balance updates flow through the same callback mechanism
- Parallel execution for quick initial balances, then consistent updates during sync
- Eliminates race conditions by having both paths use the same emission mechanism
- Gradual rollout across coin modules

### Step 3: Modular Synchronization (Long-term)

A path towards removing completely the **"full sync"** but instead splitting it out into features:
- **Balance Sync:** Quick balance retrieval
- **Operations Sync:** Transaction history synchronization  
- **Chart Data Sync:** Balance history for charts (this data no longer being derived state from Balance+Operations)
- ...

This decoupling will mean denormalisation of fields, notably changing the `Account` types: possibly removing fields like `account.balance`, `account.operations` and `account.balanceHistory`. At least in the way this is stored in redux store. In any case, this is not the concerns of 99% of the consumer of `Account` to access `.balanceHistory`.

## Decision

### gre's Aug 2025 recommendation

- Step 1 is something we can work on and is easy to implement. It focus on the UI side of things: starting working on the path of an "account balances" redux state but without impacting the existing work.
- Step 2 (in its hybrid form) is a way towards the future of `getBalances` method while still working in existing state of the full sync (hybrid = we prevent race conditions related to balance state coming from different places).
- Step 3 is the real long term solution we should aim to in order to decouple things per feature. However it can be very impacting and will need to be carefully planned. data denormalized into many redux states and queriable by parts that need it.


### High Level Architecture

## Consequences

### Pros

**Step 1 Benefits:**
- Zero breaking changes to existing architecture
- Quick implementation with minimal risk
- Immediate benefits for first 4 accounts
- Simple state management using optimistic updates

**Step 2 Benefits (Hybrid Approach):**
- True parallel execution for initial quick balance retrieval
- Single source of truth - both quick balance and full sync will feed the same local UI state via unified callback
- **Zero race conditions** - all balance updates flow through the same `onBalancesUpdate` mechanism
- Future-proof architecture aligning with long-term vision
- Consistent performance across all account counts
- Combines benefits of both Step 1 and standalone balance method

**Overall:**
- Improved user experience with < 2 seconds balance display
- Faster flows in general if we stop doing full synchronisation everywhere, less load on backend ?
- Modular architecture enabling independent feature development

### Cons

**Step 1 Limitations:**
- Still constrained by sync concurrency limits
- Partial solution - doesn't fully address accounts 5+ lag
- Implementation variability across coin modules

**Step 2 Challenges (Hybrid Approach):**
- Implementation overhead requiring bridge method additions across coin modules

**General Risks:**
- Data inconsistency between optimistic and actual balances on the UI. This means the product may evolve into actually splitting the features into different screens too OR visually make it clear if things are loaded or not.

