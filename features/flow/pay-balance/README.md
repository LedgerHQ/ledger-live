# Pay Balance

> [!CAUTION] > **Status: UNSTABLE** — In active development; API may change.

Shared Pay hero (Desktop and Mobile) for the aggregated stablecoin balance. Chrome follows
the held-stablecoin list:

- **funded** — the list has a positive crypto or countervalue amount. While `status` is
  `"loading"` this state keeps the funded chrome and skeletons the amount.
- **empty** — the list has no positive amount. Loading and catalog errors do not switch
  this to funded.

Action tiles render in both modes, as a sibling of the hero so they do not remount when
empty and funded swap.

## Usage

```tsx
import { Balance } from "@features/flow-pay-balance";

<Balance
  status={status}
  stableBalance={stableBalance}
  filter={filter}
  formatCountervalue={formatCountervalue}
/>;
```

The host passes the balance data (aggregated stable balance, `status`, `filter` and a countervalue
formatter) directly, so platform navigation and data access remain at the app composition root.
Copy is resolved inside the feature through `@shared/i18n`.

Store, persistence and test setup should import the slice from
`@features/flow-pay-balance/state` so they do not load the hero UI.

## Shared data hook (`useBalanceData`)

Both apps derive the balance data from their own portfolio source, then feed it through the shared
`useBalanceData` hook so the filter-option building, filtering, summing, status mapping and
stale-filter self-heal all live in one place (LIVE-34898). Each app only writes a thin adapter that
supplies its portfolio source, formatters and Redux/analytics callbacks:

```tsx
import { useBalanceData } from "@features/flow-pay-balance";

return useBalanceData({
  stablecoins,
  defaultStablecoins,
  filter,
  isLoading,
  isError,
  formatFiat,
  formatCrypto,
  formatCountervalue,
  onConfirmFilter,
  onResetFilter,
  onTrackEvent,
});
```

Under the hood the hook memoizes the pure `buildBalanceData` (which composes
`buildBalanceFilterOptions` + `aggregateBalance`) and runs the reset side effect when the
persisted filter no longer matches an available option. `aggregateBalance` matches held rows
to the active filter by ticker (falling back to currencyId) so market-id defaults and chain-specific
held ids still sum correctly.

`FormattedValue` is re-exported from `@ledgerhq/lumen-utils-shared` (the shared source used by both
lumen `AmountDisplay` packages) so the contract stays platform-agnostic and tracks Lumen API changes.

## Platform resolution

Only the view, state and filter-primitive components carry a platform suffix (`.web` / `.native`).
The `logic/` functions, the `hooks/` host hook, `types.ts`, the containers and view models are
platform-agnostic and import without a suffix; TypeScript `moduleSuffixes`, the bundlers
(Rspack / Metro) and the jest preset resolve the right side.

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
Every `index.*` is a pure barrel (`export *` only). UI lives under `components/` (one folder per
component); the platform-agnostic logic lives in `logic/`, the host hook in `hooks/`, Redux in
`state/` (also exported as `./state`) and the shared contracts in `types.ts`.

```text
pay-balance/
├── package.json                              # Package metadata and public exports
└── src/
    ├── __tests__/                            # Tests + shared fixtures (fixtures.tsx, renderWithStyle.web.tsx)
    ├── components/
    │   ├── Hero/                             # The balance hero component
    │   │   ├── Balance.tsx                   # Container (platform-agnostic)
    │   │   ├── useBalanceViewModel.ts
    │   │   ├── BalanceView.web.tsx           # Platform chrome around the body
    │   │   ├── BalanceView.native.tsx
    │   │   ├── BalanceBody.tsx               # Shared funded/empty tree
    │   │   ├── BalanceEmptyState.web.tsx / .native.tsx
    │   │   └── BalanceFundedState.web.tsx / .native.tsx
    │   └── Filter/                           # Filter picker + trigger
    │       ├── BalanceFilterPicker.tsx
    │       ├── BalanceFilterPickerView.web.tsx / .native.tsx
    │       ├── useBalanceFilterPickerViewModel.ts
    │       ├── BalanceFilterOptionRow.tsx    # Shared option-row composition
    │       ├── BalanceFilterOptionParts.web.tsx / .native.tsx  # Platform primitives
    │       ├── BalanceFilterPill.web.tsx
    │       ├── BalanceFilterSelect.native.tsx / BalanceFilterSelectView.native.tsx
    │       └── useBalanceFilterSelectViewModel.ts
    ├── hooks/
    │   └── useBalanceData.ts                 # Host-facing data hook
    ├── logic/                                # Platform-agnostic logic (no suffix)
    │   ├── aggregateBalance.ts               # Filter + sum + funded flag + status
    │   ├── buildBalanceFilterOptions.ts      # Filter option rows
    │   ├── buildBalanceData.ts               # build + aggregate + reset decision
    │   ├── buildStablecoinHoldings.ts        # Catalog rows, else held accounts
    │   └── resolveSelection.ts               # Heal a stale persisted filter
    ├── state/                                # UI-free Redux slice (`./state` export)
    ├── types.ts                              # Component + port contracts
    ├── exports.ts                            # Public surface (Hero container, hook, model, types)
    ├── index.ts                              # Public API barrel → ./exports
    └── index.native.ts                       # Native public API barrel → ./exports
```

## Tracking

The hero itself does not emit analytics. The host is responsible for tracking `Page Pay` with the
active `balance_filter` when the tab is viewed (Desktop `TrackPage`, Mobile `TrackScreen`).
