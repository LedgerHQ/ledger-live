---
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

fix(mobile): resolve webview state interference and staking drawer double-open

- Replace single currentAccountAtom with atomFamily (currentAccountAtomFamily) to provide manifest-scoped account state isolation between webviews
- Remove ScopeProvider wrappers from webview components (no longer needed)
- Use refs for staking drawer callbacks in EarnLiveAppNavigator to prevent useEffect re-runs when callbacks change
- Update jotai from 2.12.4 to 2.17.0, remove jotai-scope, add jotai-family

This fixes two related issues:
1. Account state bleeding between EarnWebview and WebPlatformPlayer when both are mounted simultaneously
2. Staking drawer opening multiple times due to unstable callback dependencies in the useEffect
