---
"@shared/feature-flags": minor
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Hold back a per-currency fee buffer when depositing the max of a native coin into perps, configured by the new `ptxTradeMaxConstant` flag (`feature_ptx_trade_max_constant`). Only the MAX ratio is reduced; token accounts and other ratios are unchanged.
