---
"live-mobile": minor
"@ledgerhq/live-common": minor
"@ledgerhq/wallet-api-exchange-module": minor
---

Move more Swap quote normalization to Wallet common

- Extend `QuoteDetails` with additive optional fields: `liquiditySource`, `payoutNetworkFees`, `tokenAllowance`, `tags`, `permitData`, `estimatedNetworkFee`.
- Reshape `QuoteWarning` into a discriminated union: `{ code: "highSpread" } | { code: "unrealisticQuote"; gainPercent: number }`. Consumers that compared against the `"highSpread"` string literal must switch to `warning.code === "highSpread"`.
- Normalize fractional provider slippage to one decimal place; safe-integer presets pass through untouched.
- Derive `liquiditySource` (RFQ/AMM) from the provider id and `customFields["@type"]` so `oneinchfusion` and UniswapX rows are classified consistently instead of relying on the unreliable raw API field.
