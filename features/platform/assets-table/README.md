# @features/platform-assets-table

> [!CAUTION]
> **Status: UNSTABLE** — New package; the desktop assets table is moving out of the app.

Web assets table used by Portfolio, Crypto addresses, Portfolio stocks and Account Detail.
Columns are Name, Price, Balance, Value and Trend. The package owns the row type and the cells.
Portfolio math, amount formatting and settings (countervalue currency, discreet mode) arrive through
`AssetsTablePortsProvider`, which the desktop app implements with legacy modules. The spot price
is read from `@features/platform-market-countervalues`.

## Exports

- `useAssetsTable(items, options)` builds the Lumen data table. `showPriceColumn` and
  `showTrendColumnTooltip` match the previous desktop options.
- `useAllCurrencyTrends(items, range, marketDayChangeByCurrencyId)` maps each currency id to its
  trend percentage.
- `AssetTableItem` is the row. `sanitizeAssetNameForTestId` builds the row test id.
- `AssetsTablePortsProvider` supplies formatting, balance cells, name truncation, discreet mode and portfolio reads.
- `@features/platform-assets-table/test-id` exports only `sanitizeAssetNameForTestId`, for Playwright.
