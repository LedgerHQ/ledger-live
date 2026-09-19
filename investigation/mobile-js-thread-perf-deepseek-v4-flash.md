# Mobile app slow with many accounts — JS thread investigation

**Date:** Sep 3, 2026 · **Scope:** `apps/ledger-live-mobile` + relevant `libs/`
**Symptom:** UI very slow when user has many accounts (dozens to 100+). JS thread saturated.

## TL;DR

Every sync tick, countervalue poll, and render re-runs expensive work per-account on the JS thread. Worst offenders, ranked:

1. `UPDATE_ACCOUNT` rebuilds the **whole accounts array** per sync emission → every memoized selector re-executes
2. Every mounted `CounterValue` recomputes tracking pairs over **all accounts** → O(N²) per sync wave
3. Every `AccountItem` row subscribes to the full accounts array + O(N) parent lookup → O(N²) and N extra subscriptions
4. `getPortfolio` computed **4–6× concurrently**, each O(N accounts × ~366 datapoints × BigNumber)
5. Un-memoized per-render passes: fiat ordering, distribution, operations grouping
6. Persistence re-encodes all changed accounts (500 ms throttle) on every save; startup decodes all

---

## Root causes (ranked, with evidence)

### 1. `UPDATE_ACCOUNT` rebuilds the whole array per emission — P0

`apps/ledger-live-mobile/src/reducers/accounts.ts:77-89`

```ts
[AccountsActionTypes.UPDATE_ACCOUNT]: (state, action) => {
  ...
  return { active: state.active.map(update) }; // new array every emission
},
```

Each `bridge.sync` emission dispatches one `UPDATE_ACCOUNT` (multiple partial emissions per account per wave), and each dispatch does an O(N) `.map` over **all** accounts. Because the result is a fresh `active` array, **every** `createSelector` rooted at `accountsSelector` re-executes — memoization can't help, the input reference changed.

Cadence (env defaults, `shared/env/src/definitions/team-coin-integration/index.ts:365-388`):

| Event | Interval |
|---|---|
| Background sync of all accounts | 8 min (`SYNC_ALL_INTERVAL`) |
| Pending-operations accounts re-sync | **10 s** (`SYNC_PENDING_INTERVAL`) |
| Emergency re-sync | 30 s (`SYNC_RECURRING_DELAY`) |
| Sync concurrency | 4 (`SYNC_MAX_CONCURRENT`) |
| Countervalue rate poll | 60 s |

A 100-account wave = ~100+ dispatches, each an O(N) array rebuild + invalidation of every all-accounts selector (`flattenAccountsSelector`, tracking pairs, portfolio, distribution). With accounts holding pending ops, the 10 s loop keeps this running even at rest.

### 2. Every `CounterValue` instance recomputes tracking pairs over ALL accounts — P0

`apps/ledger-live-mobile/src/components/CounterValue.tsx:73` calls `useTrackingPairs()`
→ `src/actions/general.ts:186-195` subscribes `accountsSelector`
→ `inferTrackingPairForAccounts` flattens + maps + filters ALL accounts.

With N rows mounted, each accounts change triggers ~N × O(N) recompute → **O(N²) per sync wave**, plus N re-renders. Each instance also subscribes to the full `countervaluesState` via `useCalculate`, and schedules an extra `poll()` 2 s after mount when its pair is missing (`CounterValue.tsx:76-95`) → more CV state churn. `CounterValue` is rendered per account row, per asset row, per operation row.

### 3. Per-row `accountsSelector` in `AccountItem` — O(N²) parent lookup, N extra subscriptions — P0

`apps/ledger-live-mobile/src/mvvm/features/Accounts/components/AccountItem/useAccountItemModel.ts:33-39`

```ts
const allAccount = useSelector(accountsSelector);        // full array, per row
...
const parentAccount = getParentAccount(account, allAccount); // O(N) find, per row
```

Every mounted row subscribes to the **entire** accounts array and scans it for its parent. Token-heavy lists are O(N²), and every row re-renders on every sync emission (they all share the same subscription). The parent is only needed for token accounts and is already available at the list level.

### 4. `getPortfolio` computed 4–6× concurrently — P0

`apps/ledger-live-mobile/src/mvvm/hooks/usePortfolioBalance.ts:36` (`usePortfolioAllAccounts`) + `usePortfolioThrottled` (`libs/live-countervalues-react/src/portfolio.tsx:88-132`) is mounted in at least:

- `mvvm/components/TopBar/hooks/useSyncIndicator.ts`
- `mvvm/components/TopBar/useTopBarViewModel.ts`
- `mvvm/features/Portfolio/components/PortfolioBalanceSync/index.tsx`
- `mvvm/features/Portfolio/components/PortfolioRefreshStatus/usePortfolioRefreshStatusViewModel.ts`
- `mvvm/features/Portfolio/screens/Portfolio/usePortfolioViewModel.ts`
- `mvvm/features/Portfolio/components/PortfolioBalanceSection/usePortfolioBalanceSectionViewModel.ts`
- plus `screens/Portfolio/PortfolioGraphCard.tsx` and the Analytics `ChartSection`/`AnalyticsBalanceDisplay` view models

Each holds its **own** throttled copy, so the same O(N × datapoints) computation runs up to 4–6× per tick. `getPortfolio` (`libs/live-countervalues/src/portfolio.ts:254-325`): flatten all accounts → per account `getBalanceHistoryWithChanges` (regenerates balance history from operations when stale, `balanceHistoryCache.ts:64-107`, BigNumber-per-op) + `calculateMany` over ~366 daily points → per-date reduce over all histories. Throttle settles at 5 s, but **every** CV poll (60 s) and accounts ref change busts the throttle tuple → full recompute. Upstream code itself flags it: "too many frequent updates… computation… is very expensive" and "big frame drops" (`portfolio.tsx:70-92`).

### 5. Un-memoized per-render passes — P1

- **Fiat ordering:** `useAccountsListViewModel.ts:54` — `orderAccountsByFiatValue(accounts, countervalueState, toCurrency)` runs **every render**: N `calculate()` calls + sort, no `useMemo`.
- **Distribution:** `useDistribution` (`libs/live-countervalues-react/src/portfolio.tsx:158-180`) → `getAssetsDistribution` flattens all accounts + per-currency `calculate`, recomputed **every render**. `useCategorizedAssetsFromPortfolio` calls it **4× on one screen** (parent VM + crypto/stablecoin/stock section VMs) — not hoisted.
- **Operations grouping:** `useOperationsV1` (`apps/ledger-live-mobile/src/screens/Analytics/Operations/useOperationsV1.ts:87-90`) calls `groupAccountsOperationsByDay(accounts, …)` with **no `useMemo`** on every render; its `filterOperation` closure depends on `countervaluesState` so every CV poll re-triggers it. `OperationsList.tsx:100-106` additionally does `flattenAccounts(...).find(...)` **per rendered row**.

### 6. Persistence re-encodes accounts on every save — P1

`apps/ledger-live-mobile/src/components/DBSave.ts` (accounts save throttled 500 ms) runs `accountModel.encode` (full Account → AccountRaw op serialization, `src/logic/accountModel.ts`) for **all changed accounts** on the JS thread; a sync wave re-fires the throttle repeatedly → O(waves × N × ops) of JSON stringify work. Cold start mirrors it: full `accountModel.decode` of every persisted account (`actions/accounts.ts`) then sequential per-currency hydration (`LedgerStore.tsx`).

### 7. Runner-ups — P1/P2

| Where | Cost | Frequency |
|---|---|---|
| `src/mvvm/features/Accounts/hooks/useAccountsListViewModel.ts:49-51` | `useSelector(flattenAccountsSelector, isEqual)` deep-compares the whole flattened array | every store update |
| `src/actions/general.ts:44-50` `useDistribution` | legacy + DADA distribution both flatten all accounts; several copies per screen | every CV poll / accounts change |
| `src/reducers/accounts.ts:147-159` `shallowAccountsSelector` | equality runs `flattenAccounts` twice + N hash strings | every dispatch where used (Swap, Buy, PnL) |
| `src/reducers/accounts.ts:299-309` `accountsWithUpToDateCheckSelector` | maps `{account, isUpToDate}` over all accounts | every accounts change |
| `libs/live-countervalues/src/logic.ts:169-387` + `index.tsx:239` | CV poll replaces the whole `CounterValuesState` object → every `useCalculate` consumer re-renders (upstream TODO: "Seems like a major bottleneck") | every 60 s poll |
| `src/analytics/segment.ts:340-384` | `getAccountsWithFunds` O(N) pass | every `track()` call |
| `src/bridge/SyncNewAccounts.ts:7-17` | O(N²) id diff | every accounts change |

### What's already fine

- Lists are virtualized: Accounts screen and Portfolio use FlashList-based lists (`@shopify/flash-list`); short Portfolio-tab lists are capped `.map` (≤6 items) — acceptable.
- Persistence writes are per-account DB keys with changed-only writes (`src/db.ts`) — the cost is the **encode/export pass**, not the write shape.
- `usePortfolioThrottled` (100 → 300 → 5000 ms) exists — but per-consumer, so the win is cancelled by 4–6 copies.

---

## Improvement ideas (ranked by expected impact)

1. **Batch sync dispatches** — coalesce the per-emission `UPDATE_ACCOUNT`s into one `SET_ACCOUNTS` per sync tick (one array rebuild instead of N) and stabilize the `bridgeSyncState` context value. Lib-level fix, also helps desktop. Biggest win.
2. **Lift tracking pairs out of `CounterValue`** — compute `useTrackingPairs()` once at the list/provider level and pass a `hasTrackingPair` boolean down, instead of once per row. Model: `usePrecomputedAssetListData.ts`. Turns O(N²) into O(N).
3. **Kill the per-row `accountsSelector` scan** — in `useAccountItemModel.ts`, pass the parent account down from the list factory (the list already has all accounts) or use a `Map<accountId, Account>` built once per data change. Removes O(N²) scans and N Redux subscriptions.
4. **Memoize `useOperationsV1`** — wrap in `useMemo([accounts, filterOperation, opCount])`. ~10 min, removes the worst per-render pass.
5. **Share one `getPortfolio`** — compute once via a shared selector/context; the 6 `usePortfolioBalance` consumers read the same result. Cuts the single most expensive computation by 4–6×.
6. **Memoize the accounts-list ordering** — wrap `orderAccountsByFiatValue` in `useMemo([accounts, countervalueState, toCurrency])` in `useAccountsListViewModel.ts:54`. One-line change with immediate gains.
7. **Encode only changed accounts** — thread the changed-ids from `getAccountsChanged` (`DBSave.ts`) into the export selector so unchanged accounts skip `accountModel.encode`. Boot + sync-wave storage win.
8. **Memoize distribution + hoist it** — `useMemo` in `useDistribution`, and call `useCategorizedAssetsFromPortfolio` once per screen (currently 4×).
9. **Narrow CV state subscriptions** — per-pair selectors instead of whole `CounterValuesState` in `useCalculate` (upstream TODO).

## How to verify

- Structural evidence so far — confirm with a profile: run the app with ~100 accounts, capture a Hermes/Chrome profiler session, and look for time in `inferTrackingPairForAccounts`, `getParentAccount`, `getPortfolio`, `groupAccountsOperationsByDay`, `orderAccountsByFiatValue`, `accountModel.encode`.
- `src/mvvm/components/JsThreadMonitor/` exists as a diagnostic (itself a 100 ms timer).
- Startup tracing exists (`src/StartupTimeMarker.tsx`) but nothing for steady-state jank — a perf guard is missing from `docs/`.

---

*Investigated with deepseek v4 flash*