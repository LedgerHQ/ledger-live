---
"@ledgerhq/live-common": minor
"@ledgerhq/types-live": minor
---

Introduce AccountBridgeExtensions on AccountBridge (isAccountEmpty, clearAccount, getStakesCount, isEditableOperation, isStuckOperation, getStuckAccountAndOperation). Framework defaults are injected by wrapAccountBridge with per-family overrides loaded lazily through a new loadBridgeExtensions registry slot. The 6 top-level helpers in live-common (isAccountEmpty, clearAccount, getVotesCount, isEditableOperation, isStuckOperation, getStuckAccountAndOperation) are kept as @deprecated thin proxies over getAccountBridge() — no app-side change required.
