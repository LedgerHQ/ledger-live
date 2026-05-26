---
"live-mobile": minor
---

Fix Tezos (re-)delegation silently keeping the previous baker when the user changes it from the summary screen. `useTransactionChangeFromNavigation` now applies `route.params.transaction` on (re)mount instead of only on subsequent changes.
