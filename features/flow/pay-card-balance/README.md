# Pay Card Balance

> [!CAUTION] > **Status: UNSTABLE** — In active development; API may change.

Shared Pay hero (Desktop and Mobile) for the aggregated stablecoin balance. Renders two states:

- **funded** — the aggregated stable balance formatted as a countervalue. While `status` is
  `"loading"` this state renders its amount skeleton, so the empty placeholder never flashes before
  the balance resolves.
- **empty** — a placeholder title and description, no balance. Used when the balance is zero or
  `status` is `"error"`.

## Usage

```tsx
import { PayCardBalance } from "@features/flow-pay-card-balance";

<PayCardBalance
  status={status}
  stableBalance={stableBalance}
  filter={filter}
  formatCountervalue={formatCountervalue}
  labels={labels}
/>;
```

The host passes the balance data (aggregated stable balance, `status`, `filter` and a countervalue
formatter) and the display `labels` directly, so the views stay props-only and platform navigation
and data access remain at the app composition root.

## Shared aggregation (`aggregatePayCardBalance`)

Both apps derive the balance data from their own portfolio source, then feed it through the shared
`aggregatePayCardBalance` helper so the filtering, summing and status mapping live in one place
(LIVE-34898). Each app only writes a thin adapter that maps its `useCategorizedAssetsFromPortfolio`
result into a `PayCardPortfolioPort`:

```tsx
import { aggregatePayCardBalance } from "@features/flow-pay-card-balance";

return aggregatePayCardBalance({
  stablecoins: categorizedAssets.stablecoins,
  filter,
  isLoading: isLoadingStablecoinTickers,
  isError: isStablecoinTickersError,
  formatCountervalue,
});
```

`FormattedValue` is re-exported from `@ledgerhq/lumen-utils-shared` (the shared source used by both
lumen `AmountDisplay` packages) so the contract stays platform-agnostic and tracks Lumen API changes.

## Platform resolution

Only the view and state components carry a platform suffix (`.web` / `.native`). The container, view
model, aggregation, types and barrels are platform-agnostic and import without a suffix; TypeScript
`moduleSuffixes`, the bundlers (Rspack / Metro) and the jest preset resolve the right side.

| Tooling          | How it resolves                                                            |
| ---------------- | ------------------------------------------------------------------------- |
| TypeScript (IDE) | Solution-style `tsconfig.json` → `tsconfig.web.json` / `tsconfig.native.json` |
| Desktop (Rspack) | `.web` / unsuffixed                                                        |
| Mobile (Metro)   | `.native` / unsuffixed                                                     |
| Jest             | Tests import `.web` / `.native` files explicitly                          |

Each view also has a test importing it through its full platform filename. Dead-code analysis
(knip) reads only the solution `tsconfig.json`, which declares no `moduleSuffixes`, so a suffixed
file it can reach through no other path would be reported as dead.

## Structure

This package follows the [Structure & Flow ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow).
Every `index.*` is a pure barrel (`export *` only); the components live in named files.

```text
pay-card-balance/
├── package.json                                # Package metadata and public exports
└── src/
    ├── components/
    │   └── PayCardBalance/
    │       ├── __tests__/
    │       │   ├── aggregatePayCardBalance.web.test.ts
    │       │   ├── PayCardBalanceEmptyState.web.test.tsx
    │       │   ├── PayCardBalanceEmptyState.native.test.tsx
    │       │   ├── PayCardBalanceFundedState.web.test.tsx
    │       │   ├── PayCardBalanceFundedState.native.test.tsx
    │       │   ├── PayCardBalanceView.web.test.tsx
    │       │   ├── PayCardBalanceView.native.test.tsx
    │       │   └── usePayCardBalanceViewModel.web.test.ts
    │       ├── PayCardBalance.tsx               # Component container (platform-agnostic)
    │       ├── PayCardBalanceView.web.tsx       # Web presentational UI (state switch)
    │       ├── PayCardBalanceView.native.tsx    # Native presentational UI (state switch)
    │       ├── PayCardBalanceEmptyState.web.tsx
    │       ├── PayCardBalanceEmptyState.native.tsx
    │       ├── PayCardBalanceFundedState.web.tsx
    │       ├── PayCardBalanceFundedState.native.tsx
    │       ├── aggregatePayCardBalance.ts       # Shared portfolio aggregation
    │       ├── index.ts                         # Barrel
    │       ├── types.ts                         # Component + port contracts
    │       └── usePayCardBalanceViewModel.ts    # Shared state derivation
    ├── index.ts                                 # Public API (barrel)
    └── index.native.ts                          # Native public API (barrel)
```

## Tracking

The hero itself does not emit analytics. The host is responsible for tracking `Page Pay` with the
active `balance_filter` when the tab is viewed (Desktop `TrackPage`, Mobile `TrackScreen`).
