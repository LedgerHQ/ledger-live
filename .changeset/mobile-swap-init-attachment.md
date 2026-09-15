---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-mobile-e2e-tests": patch
"ledger-live-desktop-e2e-tests": patch
---

Surface the swap-init root cause on mobile E2E failures

When the device stalls on "Exchange app is ready", `waitForReviewTransaction` appends a hint telling
the reader to open the "⚠️ Swap-init error" attachment. That hint lives in shared code and is
emitted on both platforms, but the attachment was produced by the desktop harness only, so on
mobile it pointed at something that never existed.

The extraction now lives in `@ledgerhq/live-e2e-shared/swapInitError` and both harnesses use it.
Mobile attaches the result first, scanning the app logs and the webview console together, because
the failure can surface on either side of the wallet-api call. Desktop delegates to the shared
function and keeps its previous output.
