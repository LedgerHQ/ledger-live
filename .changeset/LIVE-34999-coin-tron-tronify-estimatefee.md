---
"@ledgerhq/coin-tron": minor
---

Add Tronify energy-rent fee option to `estimateFees`.

When `feeOptionId: "tronify"` is passed via `EstimateFeesOptions`, `estimateFees` prices the Tronify energy-rental option alongside the standard on-chain burn. The returned `FeeEstimation` carries `value` (Tronify rental cost in SUN), `originalValue` (standard burn cost for comparison), and `savings` (non-negative difference, `0n` when Tronify is not cheaper). Errors from the Tronify API propagate without fallback, per ADR-050 Option 3.
