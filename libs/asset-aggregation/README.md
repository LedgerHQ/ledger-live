# asset-aggregation

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

`@ledgerhq/asset-aggregation` aggregates and categorizes assets across all user accounts for portfolio display in Ledger Live. It computes per-asset totals, groups assets by category, and calculates the distribution of holdings — feeding the portfolio and asset screens on both desktop and mobile.

## What it does

- Aggregates balances for the same currency across multiple accounts into a single asset view
- Categorizes assets (crypto, token, NFT, etc.)
- Computes asset distribution (percentage breakdown of holdings by asset)
- Provides mock data for development and testing

## Key exports / concepts

- `assetAggregation` — core logic to merge accounts into a deduplicated asset list
- `assetCategorization` — classifies assets by type/category
- `assetDistribution` — computes portfolio share (%) per asset
- `mocks/` — mock asset data for tests and Storybook

## Usage context

Used in both `apps/ledger-live-desktop` and `apps/ledger-live-mobile` on the portfolio and asset list screens. Typically consumed alongside `@ledgerhq/live-countervalues` to enrich aggregated assets with fiat values.
