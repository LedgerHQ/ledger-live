---
"@ledgerhq/types-live": minor
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

feat(desktop): enforce manifest domain whitelist on webview navigation

Add `lldWebviewManifestDomainCheck` feature flag that, when enabled,
gates webview navigation to origins declared in the manifest's `domains`
array — mirroring the mobile `originWhitelist` behavior on desktop.

- Introduce `isUrlAllowedByManifestDomains` utility in `manifestDomainUtils`
  supporting exact-origin, protocol-wildcard (`https://*`), and subdomain-
  wildcard (`https://*.example.com`) patterns; only `http:` and `https:`
  schemes are ever permitted
- Wire the check in `useWebviewState` to gate `loadURL` calls and the
  initial `src` prop
- Pass `manifest.domains` through the IPC channel (`webview-dom-ready`)
  so the main process can attach a `will-navigate` handler that blocks
  out-of-whitelist navigations at the Electron layer
- Register `lldWebviewManifestDomainCheck` in `feature.ts` and
  `defaultFeatures.ts`
- Add comprehensive unit tests for `isUrlAllowedByManifestDomains`
