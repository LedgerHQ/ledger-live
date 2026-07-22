---
"@ledgerhq/live-common": minor
"live-mobile": minor
---

Fix custom fees on iOS in the new send flow: accept a comma decimal separator (normalized to a dot so the value is valid and can be confirmed), and dismiss the keyboard by tapping outside the inputs so the Confirm button is reachable
