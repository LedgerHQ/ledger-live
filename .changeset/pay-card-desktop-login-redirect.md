---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
---

Complete the Card login on desktop. The hosted page opens in a window that reports nothing back, so it now answers `pending` instead of a dismissal: the attempt outlives the window, and the machine waits for the redirect. `ledgerlive://paytab?code=…` carries that redirect, the Pay tab hands the code to the machine, and the exchange signs the card holder in. The login stays pressable while it waits, because a redirect that never arrives must not need a restart of the app.

The desktop login block also renders a centred design: a title, a description, and one action. Mobile keeps its inline row. Both read the same copy keys.

Desktop opens the provider's page in the Discover webview, and no longer in a separate window. The Card manifests carry the authorize page and the hosted UI, so the app navigates to the live app that holds each one. The manifest owns the base URL, and the authorize query travels as webview inputs, which the live app appends to it. The signup page is a path no manifest carries, so that URL travels whole. The `lwdPayTab` flag carries `baanx_login_manifest_id` and `baanx_hosted_manifest_id`, which default to the staging manifests. The flow takes the opener as a prop, which keeps the webview with the app that owns it; mobile keeps its secure browser.
