---
"ledger-live-desktop": patch
"live-mobile": patch
---

Render the Contacts "edit external address" device intent. Both apps replace the placeholder renderer with the same screens as register and rename — `ContinueOnDevice` while the user confirms, and an `InfoState` per failure: rejection, wrong device, invalid data, app version too low, and a generic error — plus a dedicated screen explaining that changing an address label is not supported by the device yet.
