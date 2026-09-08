---
"@ledgerhq/coin-tron": minor
---

Add Tronify energy-rent fee option to `estimateFees`.

When `feeOptionId: "tronify"` is passed via `EstimateFeesOptions`, the CoinModule API's `estimateFees` dispatches to a dedicated `estimateTronifyFees` path that still computes the standard on-chain burn for comparison and prices the Tronify energy-rental option against it. The returned `FeeEstimation` carries `value` (Tronify rental cost in SUN), `originalValue` (standard burn cost for comparison), and `savings` (non-negative difference, `0n` when Tronify is not cheaper). Errors from the Tronify API propagate without fallback, per ADR-050 Option 3.
