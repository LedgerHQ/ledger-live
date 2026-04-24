---
"ledger-live-desktop": minor
---

Prevent Live Apps from launching external OS apps via custom URL schemes.

Harden Live App <webview> guests against Chromium external-protocol handoff (itms-apps:, ms-word:, file:, ...) across every navigation vector: iframe src, window.open, window.location, HTTP 3xx redirects, subframe navigations and form submissions.
A restrictive frame-src / child-src / form-action CSP is injected on every guest document response, preserving any CSP already set by the Live App. Ledger Live's own ledgerlive: / ledgerwallet: deep links remain allowed.
