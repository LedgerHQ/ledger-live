# asset-detail

`@ledgerhq/asset-detail` is a shared module providing React hooks, types, and utilities for the asset detail screen in Ledger Live. It abstracts the data-fetching and formatting logic needed to display an asset's market data (price, chart, stats) in one place, shared between desktop and mobile.

## What it does

- Exposes React hooks that fetch and combine market data for a given asset
- Provides shared TypeScript types for asset detail state and props
- Contains utility helpers for formatting and transforming asset detail data
- Decouples the asset detail data layer from platform-specific rendering

## Key exports / concepts

- `hooks/` — React hooks (e.g. market data fetcher, price change computation)
- `types.ts` — shared types for asset detail data structures
- `utils/` — formatting and transformation helpers

## Usage context

Imported by both `apps/ledger-live-desktop` and `apps/ledger-live-mobile` on their respective asset detail screens. Works alongside `@ledgerhq/live-countervalues` for fiat conversion and market data APIs.
