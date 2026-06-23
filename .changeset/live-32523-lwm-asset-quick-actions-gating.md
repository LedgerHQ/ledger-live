---
"live-mobile": patch
"ledger-live-desktop": patch
"@ledgerhq/asset-detail": minor
---

Share the Asset Detail trade-availability gating between mobile and desktop. Extracted `useTradeAvailability` and the ramp ledger-id resolution helpers (`resolveRampLedgerIds`, `ledgerIdsFromLedgerCurrency`, `isAvailableOnBuy`, `isAvailableOnSwap`) into `@ledgerhq/asset-detail`, and refactored desktop to consume them. Mobile now gates the Asset Detail CTAs (Buy/Swap/Receive) on the same logic: a currency that is not supported by the build or deactivated by a feature flag exposes no transfer actions (footer and in-page), while supported assets without buy/swap show the existing "Swap and Buy are not supported for this asset." banner.
