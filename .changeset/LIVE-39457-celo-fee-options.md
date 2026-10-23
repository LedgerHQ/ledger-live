---
"@ledgerhq/coin-celo": patch
---

Add `listFeeOptions` (ADR-050) to the Celo coin-module and make its `estimateFees` forward `customFeesParameters` and the selected `feeOption` instead of dropping them.
