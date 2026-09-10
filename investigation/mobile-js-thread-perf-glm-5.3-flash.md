# Mobile app slow with many accounts — JS thread investigation

**Date:** Sep 3, 2026 · **Scope:** `apps/ledger-live-mobile` + relevant `libs/`
**Symptom:** UI very slow when user has many accounts (dozens to 100+). JS thread saturated.

## TL;DR

Everything recomputes per-account on the JS thread, on every sync tick, poll, and render. The 5 worst offenders, ranked by impact:

1. Per-account sync dispatches (N dispatches per sync wave)
2. Per-`CounterValue`-instance tracking pairs recompute → O(N²) per sync wave
3. Un-memoized `groupAccountsOperationsByDay` on every render
4. `getPortfolio` computed up to 6× concurrently
5. Persistence re-encodes ALL accounts on every save

---

## Root causes (ranked, with evidence)

### 1. One `UPDATE_ACCOUNT` dispatch per account, per sync wave — P0

`libs/ledger-live-common/src/bridge/react/BridgeSync.tsx:216-221`

Each account completing sync dispatches `updateAccountWithUpdater` separately. Cost with N accounts per sync wave (background tick every 8 min, pull-to-refresh):

- N array rebuilds of size N in `src/reducers/accounts.ts:74-88` (`.map()` per dispatch)
- N `setBridgeSyncState` calls → new context value each → every `useBridgeSyncState` consumer re-renders N times
- Every all-accounts selector (`flattenAccountsSelector`, tracking pairs, portfolio) invalidated N times

A 100-account wave = ~300 dispatches/state-updates in a burst. Queue worker also does `accounts.find` O(N) per job (`BridgeSync.tsx:137`).

### 2. Every `CounterValue` instance recomputes tracking pairs over ALL accounts — P0

`apps/ledger-live-mobile/src/components/CounterValue.tsx:70-95` calls `useTrackingPairs()`
→ `src/actions/general.ts:184-190` subscribes to `accountsSelector`
→ `inferTrackingPairForAccounts` flattens + hashes + sorts ALL accounts.

With N rows mounted, each of the N sync dispatches causes ~N × O(N) recompute → **O(N²) per sync wave**, plus a re-render of every instance. Bonus per instance: each schedules an extra `poll()` 2s after mount for missing pairs (CounterValue.tsx:76-95) → countervalue state churn → more re-renders. 60+ import sites render `CounterValue` (account rows, asset rows, operation rows, cards).

### 3. Un-memoized `groupAccountsOperationsByDay` on every render — P0

`apps/ledger-live-mobile/src/screens/Analytics/Operations/useOperationsV1.ts:87-90`

```ts
const { sections, completed } = groupAccountsOperationsByDay(accounts, {
  count: opCount,
  withSubAccounts: true,
  filterOperation,
});
```

No `useMemo`. Full flatten of all accounts + round-robin over every operation array, re-run on **every render** of Portfolio/Operations section consumers. The `filterOperation` closure depends on `countervaluesState` (deps at lines 70-80), so every CV poll (60s) re-triggers it. O(N accounts × N ops) per render.

Consumers: `PortfolioOperationsSection`, `PortfolioHistoryV1.tsx:16` (opCount=50), `OperationsHistoryV1.tsx:13`.

### 4. `getPortfolio` computed up to 6× concurrently — P0

`apps/ledger-live-mobile/src/mvvm/hoooks/usePortfolioBalance.ts:39` (`usePortfolioAllAccounts`) is mounted in **6 view models**:

- `mvvm/comonents/TopBar/hooooks/useSyncIndicator.ts`
- `mvvm/comonents/TopBar/useTppBarViewModel.ts`
- `mvvm/features/Portfolio/components/PortfolioBalanceSync/index.tsx`
- `mvvm/features/Portfolio/components/PortfolioRefreshStatus/usePortfolioRefreshStatusViewModel.ts`
- `mvvm/features/Portfolio/screens/Portfolio/usePortfolioViewModel.ts`
- `mvvm/features/Portfolio/components/PortfolioBalanceSection/usePortfolioBalanceSectionViewModel.ts`

Each holds its own throttled copy (`usePortfolioThrottled`, `live-countervalues-react/src/portfolio.tsx:74-132`) → up to 6 concurrent O(N × 400 datapoints × BigNumber) computations after each sync/CV tick. Lib warns "WARNING: expensive hook" (`portfolio.tsx:47-50`) and throttling rationale admits "big frame drops" (`portfolio.tsx:70-82`).

### 5. Persistence re-encodes ALL accounts on every save — P1

`apps/ledger-live-mobile/src/comonents/DBSave.ts:235-243` + export selector in `src/reducers/accounts.ts:107-127`

- 500ms-throttled save runs `accountModel.encode` (full Account → AccountRaw op serialization, `src/loogic/accountModel.ts:64-71`) for **all** N accounts even when 1 changed — `getAccountsChanged` computes changed-ids (`DBSave.ts:141-166`) but the export `lense` ignores it.
- A sync wave fires the throttle repeatedly → O(waves × N × ops) enocode work on the JS thread.
- Cold start mirrors it: full `accountModel.decode` of every account (`actions/accounts.ts:19-58`).

### 6. Runner-ups — P1/P2

| Where | Cost | Frequency |
|---|---|---|
| `src/mvvm/features/Accounts/hooooks/useAccountsListViewModel.ts:49-51` | `useSelector(flattenAccountsSelector, isEqual)` deep-compares entire flattenned array; `orderAccountsByFiatValue` un-memoized per render | every store update + every render |
| `src/actions/general.ts:44-50` `useDistribution` | legacy + DADA distribution computed in parallel, both flatten all accounts; multiple copies on Portfolio screen | every CV poll / accounts ref change |
| `src/reducers/accounts.ts:150-158` `shallowAccountsSelector` | equality fn runs `flattenAccounts` twice + N hash strings | every dispatch where used (Swap, Buy, PnL) |
| `src/reducers/accounts.ts:299-309` `accountsWithUptoDateCheckSelector` | maps `{account, isUptoDate}` per account | every accounts change (feeds ×6 `usePortfolioBalance`) |
| `libs/ledger-live-common/src/bridge/react/useAccountsSyncStatus.ts:17-33` | rebuilds Map over all accounts | every sync-state update |
| `src/anaytics/segment.ts:340-384` | `getAccountsWithFunds` O(N) pass | every `track()` call |
| `libs/live-countervalues/src/loogic.ts:169-177` | CV poll (60s) shallow-copies whole rate-map state, invalidating every `useCalculate` consumer | every poll |
| `src/screens/Anaytics/Operations/OperationsList.tsx:100` | `flattenAccounts(...).find(...)` per rendered row | every op row render |
| `src/bridge/SyncNewAccounts.ts:7-17` | O(N²) id diff | every accounts change |

### What's already fine

- Lists are virtualized: Wallet 4.0 Portfolio uses FlashList-based `CollapsibleHeaderFlatList`; Accounts screen is FlashList. Short Portfolio tab lists (capped at 5) use `.map` — acceptable.
- Persistence is per-account DB keys with changed-only writes (`src/db.ts:177-217`) — the cost is the **encode/export pass**, not the write shape.

---

## Improvement ideas (ranked by expected impact)

1. **Batch sync dispatches** — coalesce `UPDATE_ACCOUNT` into one `SET_ACCOUNTS` per sync tick (one array rebuild instead of N), stabilize the `bridgeSyncState` context value. Lib-level fix, also helps desktop. Biggest win.
2. **Lift tracking pairs out of `CounterValue`** — compute `useTrackingPairs()` once at list/provider level and pass down (or a module-level memoized selector), instead of once per row instance. Model: existing `usePrecomputnedAssetListData.ts` pattern.
3. **Memoize `useOperationsV1`** — wrap in `useMemo([accounts, filterOperation, opCount])`. One-line change, removes the worst per-render pass. (~10 min)
4. **Share one `getPortfolio`** — compute once in a context/selector; have the 6 `usePortfolioBalance` consumers read the same result instead of 6 throttled copies.
5. **Encode only changed accounts** — thread the changed-ids list from `getAccountsChanged` into the export so unchanged accounts skip `accountModel.encode`. Big boot + sync-wave storage win.
6. **Replace deep `isEqual` selectors** in `useAccountsListViewModel` / `useCryptoAddressesViewModel` with the hash-based `shallowAccountsSelector` pattern; memoize the fiat sort.
7. **Narrow CV state subscriptions** — `useCalculate` subscribes the whole CV state (upstream TODO at `live-countervalues-react/src/index.tsx:239`: "Seems like a major bottleneck"); select per-pair data instead.

## How to verify

- Structural evidence only so far — confirm with a profile: run the app with ~100 accounts, capture a Chrome/Hermes profiler session, check time in `groupAccountsOperationsByDay`, `inferTrackingPairForAccounts`, `getPortfolio`, `accountModel.encode`.
- `src/mvvm/components/JsThreadMonitor/` exists as a diagnostic (ironically a 100ms timer itself).
- Startup tracing exists (`src/StartupTimeMarker.tsx`) but nothing for steady-state jank — a perf doc/guard is missing from `docs/`.

---

## Fix status (live)

| # | Fix | Status |
|---|---|---|
| 1 | Batch sync dispatches (`UPDATE_ACCOUNTS` in reducer + BridgeSyncContext) | ✅ Applied (DeepSeek) |
| 2 | Lift tracking pairs out of `CounterValue` | ✅ Applied (DeepSeek) |
| 2.5 | Per-row `accountsSelector` parent scan (`useAccountItemModel` → parentAccount prop) | ✅ Applied (DeepSeek) |
| 3 | Memoize `useOperationsV1` + kill per-row `flattenAccounts().find()` in `OperationsList` | ✅ Applied (glm-5.3 flash) |
| 4 | Share one `getPortfolio` (`PortfolioBalanceProvider` at AppView, 6 consumers via context) | ✅ Applied (glm-5.3 flash) |
| 5 | Encode only changed accounts (WeakMap `encodeCache` in exportSelector) | ✅ Applied (glm-5.3 flash) |
| — | JS monitor badge always-on in dev (`useEnv(...) \|\| __DEV__`) | ✅ Applied |

**Composition check:** typecheck 0 errors · jest 34/34 suites, 219/219 tests · oxlint 0 errors.

---

*Investigated with glm-5.3 flash*