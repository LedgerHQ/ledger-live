---
"@features/flow-pay-card-auth": minor
"@features/flow-pay-card": minor
"@shared/env": minor
"ledger-live-desktop": minor
---

Complete the Card login on desktop. The hosted page opens in a window that reports nothing back, so it now answers `pending` instead of a dismissal: the attempt outlives the window, and the machine waits for the redirect. `ledgerlive://paytab?code=…` carries that redirect, the Pay tab hands the code to the machine, and the exchange signs the card holder in. The login stays pressable while it waits, because a redirect that never arrives must not need a restart of the app.

The desktop login block also renders a centred design: a title, a description, and one action. Mobile keeps its inline row. Both read the same copy keys.

Desktop opens the provider's page in the Discover webview, and no longer in a separate window. The Card manifests carry the authorize page and the hosted UI, so the app navigates to the live app that holds each one and hands it the URL the flow built. `CARD_LOGIN_MANIFEST_ID` and `CARD_HOSTED_MANIFEST_ID` name those two manifests, so a tester can point the login at staging from the debug settings. The flow takes the opener as a prop, which keeps the webview with the app that owns it; mobile keeps its secure browser.
