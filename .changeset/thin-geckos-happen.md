---
"live-mobile": minor
"ledger-live-desktop": minor
---

Clean up legacy Swap code paths now that the Wallet 4.0 swap experience is the
default. The Wallet 4.0 feature-config gating (`useWalletFeaturesConfig` /
`shouldDisplayWallet40MainNav`) has been dropped from the swap surfaces, keeping
only the v4 path:

- Mobile: every Swap entry point (the `ledgerlive://swap` deeplink, no-funds
  drawers, staking error CTAs, …) now routes through `Main → Swap → SwapTab`,
  and the swap live-app handlers (pending operation, custom error, loading,
  history) always navigate via the `SwapSubScreens` navigator. The legacy
  top-level Swap navigator routing and its reset action have been removed.
- Mobile: `SwapTab` always renders `SwapLiveAppWallet40` (the legacy
  `SwapLiveApp` screen branch is gone) and its header stays hidden, since the
  Wallet 4.0 `MainNavigator` tab owns the chrome.
- Desktop: the Swap2 page always renders with the Wallet 4.0 `PageHeader`
  layout, and `SwapWebViewEmbedded` no longer takes an `isWallet40` prop (it
  always uses the v4 bordered container).
- Mobile + Desktop: the `lwm40enabled` / `lwd40enabled` webview inputs sent to
  the swap live-app are now hardcoded to `"true"` instead of being derived from
  the wallet-features config.
- Removed dead swap code left over from the v4 migration: the `SwapLiveApp`
  screen, the legacy `WebView.tsx`, the `useSwapHeaderNavigation` /
  `useSwapNavigationHelper` hooks, the `ScreenName.SwapLiveApp` enum entry, and
  the `SwapLiveAppNavigationParams` type.
