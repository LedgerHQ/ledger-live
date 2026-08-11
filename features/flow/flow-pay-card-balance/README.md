# Pay Card Balance

> [!CAUTION] > **Status: UNSTABLE** — In active development; API may change.

Desktop Pay hero for the aggregated stablecoin balance. Renders two states:

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

## Structure

This package follows the [Structure & Flow ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow).
Every `index.*` is a pure barrel (`export *` only); the components live in named files.

```text
flow-pay-card-balance/
├── package.json                              # Package metadata and public exports
└── src/
    ├── components/
    │   └── PayCardBalance/
    │       ├── __tests__/
    │       │   ├── PayCardBalanceView.web.test.tsx
    │       │   └── usePayCardBalanceViewModel.web.test.ts
    │       ├── PayCardBalance.web.tsx         # Web component container
    │       ├── PayCardBalanceView.web.tsx     # Web presentational UI (state switch)
    │       ├── PayCardBalanceEmptyState.web.tsx
    │       ├── PayCardBalanceFundedState.web.tsx
    │       ├── index.ts                       # Barrel
    │       ├── types.ts                       # Component contracts
    │       └── usePayCardBalanceViewModel.ts  # Shared state derivation
    └── index.ts                              # Public API (barrel)
```

## Tracking

The hero itself does not emit analytics. The host is responsible for tracking `Page Pay` with the
active `balance_filter` when the tab is viewed.
