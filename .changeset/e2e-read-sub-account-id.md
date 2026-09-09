---
"ledger-live-mobile-e2e-tests": patch
"live-mobile": patch
---

Read the sub-account id from the screen in `navigateToSubAccount` instead of rebuilding it. Rebuilding meant hardcoding one of the two id formats in the wild: an account synced before the generic coin framework keeps the format it was stored under, a newer one gets `encodeTokenAccountId`. The helper now opens the sub-account from the flat accounts list and returns the id the app gave it, with an identity assertion that does not depend on the id it just read.

`navigateToTokenInAccount` expands the token list when the "see more" button is present. The list shows three tokens while collapsed, so a fourth one was never on screen to scroll to. Adds a `testID` to that button in `SubAccountsList`.
