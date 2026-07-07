---
"live-mobile": minor
---

Remove the WalletTabNavigator: with the Market tab gone, the wallet tab was a navigator wrapping a single Portfolio screen. The Portfolio screen is now rendered directly under the `ScreenName.Portfolio` route via the new `PortfolioRootScreen` wrapper (which keeps the portfolio chrome — header, gradient, balance sync, scroll manager), and the route is reclassified from a `NavigatorName` to the existing `ScreenName.Portfolio` screen. Also removes the dead `NavigatorName.Market` references left under the wallet tab (param list, deeplink linking config, transfer drawer analytics), routes the bare `market` deeplink fallbacks through `handleMarketBannerDeeplink`, and renames the `navigateToPortfolioWalletTab` helper to `navigateToPortfolio`.
