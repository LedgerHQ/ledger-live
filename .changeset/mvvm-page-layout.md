---
"ledger-live-desktop": minor
---

Refactor Page component to MVVM architecture with Wallet 4.0 layout support

- Add Page component in mvvm/components with MVVM pattern (Container → ViewModel → View)
- Add RightPanel component for sidebar content (SwapWebView) on supported pages
- Support dual layouts: Classic (styled-components) and Wallet 4.0 (Tailwind)
- Add isWallet40 prop support to OperationsList, AssetDistribution, SwapWebViewEmbedded, GlobalSummary
- Add responsive layout for AssetDistribution with HIDE_BAR_THRESHOLD
- Add auto-collapse sidebar when Wallet 4.0 is enabled on narrow screens
- Update Portfolio to use Wallet40PageContent wrapper
- Update Analytics with isWallet40 styling
