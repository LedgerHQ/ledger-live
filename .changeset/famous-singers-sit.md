---
"@ledgerhq/types-live": minor
"live-mobile": minor
"@ledgerhq/live-common": minor
---

feat(mobile): enforce manifest domain whitelist on webview navigation

Add `llmWebviewManifestDomainCheck` feature flag that, when enabled,
replaces the native `originWhitelist` (whose regex is unanchored) with
`isUrlAllowedByManifestDomains`-based JS-level checks on mobile.

- Register `llmWebviewManifestDomainCheck` in `feature.ts` and
  `defaultFeatures.ts`
- Wire the check in mobile `useWebviewState` to gate the initial URL,
  `loadURL` calls, and `onShouldStartLoadWithRequest` navigation requests
- Expose `isBlockedByDomainCheck` from `useWebviewState` and `useWebView`
  so components can react to a fully blocked manifest
- Extend `WebviewState` with `isAppUnavailable` to surface the blocked
  state to parent screens via `onStateChange`
- Show `NetworkError` immediately in `WalletAPIWebview` and
  `PlatformAPIWebview` when blocked, avoiding an infinite loading spinner
- Apply the same pattern to both `WalletAPIWebview` and
  `PlatformAPIWebview`
