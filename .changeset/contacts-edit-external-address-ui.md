---
"ledger-live-desktop": patch
"live-mobile": patch
---

Render the Contacts "edit external address" device intent. Both apps replace the placeholder renderer with the same screens as register and rename — `ContinueOnDevice` while the user confirms, and an `InfoState` per failure: rejection, wrong device, invalid data, app version too low, and a generic error.

An edit that changes both the address and its label asks the user to confirm twice on the device, and the renderers stay deliberately generic across the two: they show the same waiting screen for each step rather than numbering them.
