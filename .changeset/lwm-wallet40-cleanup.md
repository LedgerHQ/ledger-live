---
"live-mobile": patch
---

Remove the legacy Portfolio screen and de-gate `lwmWallet40.enabled` across WXP-owned mobile code now that Wallet 4.0 is always on: `PortfolioRootScreen` always renders the MVVM `Portfolio` / `ReadOnlyPortfolio` (legacy screens deleted); `TransferDrawer`, `MarketInsightDefinitionSheet` and `FearAndGreedDefinitionSheet` always use the Lumen `QueuedDrawerBottomSheet`; `useNavigationBarHeights` / `useTabBarVisibility` drop their fail-fast flag guards; `useWallet40Theme` always returns the Wallet 4.0 theme (portfolio background); and the operations-history "See all" button uses a constant bottom margin.
