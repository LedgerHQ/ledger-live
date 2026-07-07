---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@features/platform-feature-flags": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Remove the `graphRework` param of the Wallet 4.0 feature flag on both platforms. The param is no longer consumed on desktop (LIVE-33502) nor mobile, so it is dropped entirely: from the `lwmWallet40` / `lwdWallet40` schemas, the shared `Feature_Wallet40_Params` type, the analytics helper, the `shouldDisplayGraphRework` getter in `useWalletFeaturesConfig`, and both platforms' debug dev-tool lists.

On mobile the Wallet 4.0 balance hero is now always rendered: the legacy portfolio graph card is dropped from the portfolio header and read-only screens (the `GraphCard` / `GraphCardContainer` / `PortfolioGraphCard` components stay, still used by the Analytics screen), and the graphRework gating is removed from every mobile call site (Portfolio screen/VM, `Delta`, settings reducer, WalletAssets VM).
