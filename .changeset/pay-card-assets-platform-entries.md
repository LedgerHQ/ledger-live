---
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card-details": minor
"@features/flow-pay-card": minor
---

Split the card assets exports by platform: `CardAssets` moves to the `./web` entry, and the native `CardAssetsView` and the asset drawers (`CardAssetDetailsDrawer`, `CardAssetDetailsWithdrawDrawer`, `CardAssetTransactionDetailDrawer`, `CardAssetsManageDrawer`) move to the `./native` entry, each with its props type. The `.` entry keeps the hooks, the selector and the types on both platforms. `CardAssetsManageFooter` is no longer exported.
