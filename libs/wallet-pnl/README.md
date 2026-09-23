# wallet-pnl

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/wallet-pnl` computes Profit & Loss (PnL) for crypto assets and the overall portfolio inside Ledger Live. It implements the **Average Cost Basis (ACB)** accounting method to translate on-chain operation history into realised and unrealised gains, percentage returns, and trend indicators.

## What it does

- Classifies every account operation (buy, sell, receive, send, swap, …) into cost-basis events.
- Maintains a **cost basis cache** and reconciles it against live on-chain data to keep PnL consistent across syncs.
- Computes **per-asset PnL** (`computeAssetPnL`), **asset-group PnL** (`computeAssetGroupPnL`), and **portfolio-level PnL** (`computePortfolioPnL`).
- Calculates percentage return and trend direction for display in the UI.
- Exposes React hooks for consuming PnL data in components.

## Key exports / concepts

- `computeAssetPnL(asset, operations, countervalues)` — per-asset realised/unrealised PnL.
- `computeAssetGroupPnL(...)` — grouped asset PnL (e.g. all ETH accounts).
- `computePortfolioPnL(accounts, countervalues)` — aggregated portfolio view.
- `classifyOperation(op)` — maps an operation type to its ACB impact.
- `costBasis / costBasisCache / costBasisReconciliation` — core accounting logic.
- `trendFromSign(sign)` — up/down/flat indicator.
- Hooks in `hooks/` for React integration.

## Usage context

Used by `apps/ledger-live-desktop`, `apps/ledger-live-mobile` and the `apps/web-tools` pnl-calculator to power the portfolio PnL view and per-asset detail screens. Uses `@ledgerhq/types-live` for account/operation types.

## Setup

The package does not convert to fiat itself. It declares the countervalues operations it needs as a `RateLookup` ([`src/rateLookup.ts`](./src/rateLookup.ts)) and treats the countervalues state it receives as opaque. The host app registers an implementation once at startup, before any PnL is computed:

```ts
import { setRateLookup } from "@ledgerhq/wallet-pnl";
import { calculate, historyKey, inferCurrencyAPIID } from "@domain/entity-market-countervalues";

setRateLookup({ calculate, historyKey, currencyApiId: inferCurrencyAPIID });
```

Computing PnL before that throws `Rate lookup is not set`. The apps register it in their composition roots (`src/config/bridge-setup.ts` in desktop and mobile, `src/live-common-setup.ts` in web-tools), and each app's jest setup registers it for tests.
