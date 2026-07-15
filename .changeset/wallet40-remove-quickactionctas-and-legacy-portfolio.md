---
"@ledgerhq/types-live": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"@features/platform-feature-flags": minor
"live-mobile": minor
---

Wallet 4.0 Q1 cleanup on mobile:

- Remove the `quickActionCtas` param of the `lwmWallet40` feature flag. The quick-action CTAs are now always enabled; the `shouldDisplayQuickActionCtas` getter and the legacy `PortfolioQuickActionsBar` are removed.
- Remove the legacy (pre-4.0) Portfolio screen. `PortfolioRootScreen` now always renders the MVVM `Portfolio` / `ReadOnlyPortfolio`, and the dead legacy screen files are deleted.
