---
"ledger-live-desktop": patch
"@ledgerhq/live-common": patch
---

Log manifest domain check violations, rejected `goToURL` fallbacks and rejected `loadURL` calls to the exported logs, once per distinct violation. Add `resolveInitialURL`, which returns the initial URL along with the `goToURL` it rejected
