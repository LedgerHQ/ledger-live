---
"@features/flow-pay-card-assets": minor
"@features/flow-pay-card-details": minor
---

Name the card assets view model callbacks after their intent: `onAssetPress` becomes `onOpenAsset`, `onTopUpPress` becomes `onTopUpAsset`, `onWithdrawPress` becomes `onOpenWithdraw`, `onShowHistoryPress` becomes `onShowHistory`, `onManagePress` becomes `onManageAssets`, `onRetryPress` becomes `onRetry` and `onAddAssetPress` becomes `onAddAsset`. `CardAssetDetailsDrawer` takes `onOpenTransaction` instead of `onTransactionPress`.
