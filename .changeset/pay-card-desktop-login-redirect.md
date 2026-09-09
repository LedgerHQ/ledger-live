---
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": minor
---

Complete the Card login on desktop. The hosted page opens in a window that reports nothing back, so it now answers `pending` instead of a dismissal: the attempt outlives the window, and the machine waits for the redirect. `ledgerlive://paytab?code=…` carries that redirect, the Pay tab hands the code to the machine, and the exchange signs the card holder in. The login stays pressable while it waits, because a redirect that never arrives must not need a restart of the app.

The desktop login block also renders a centred design: a title, a description, and one action. Mobile keeps its inline row. Both read the same copy keys.
