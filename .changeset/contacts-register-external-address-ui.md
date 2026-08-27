---
"ledger-live-desktop": patch
"live-mobile": patch
"@features/platform-contacts": patch
---

Render the Contacts "register external address" device intent. The job now publishes the connected device with `awaiting-device-confirmation`, so each app maps the job state to `ContinueOnDevice` while the user confirms, and to an `InfoState` per failure: rejection, wrong device, invalid data, app version too low, and a generic error.
