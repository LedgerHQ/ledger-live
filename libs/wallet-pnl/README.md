# wallet-pnl

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

Used by `apps/ledger-live-desktop` and `apps/ledger-live-mobile` to power the portfolio PnL view and per-asset detail screens. Depends on `@ledgerhq/live-countervalues` for fiat conversion and `@ledgerhq/types-live` for account/operation types.
