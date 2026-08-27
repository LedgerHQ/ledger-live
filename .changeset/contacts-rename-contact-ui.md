---
"ledger-live-desktop": patch
"live-mobile": patch
---

Render the Contacts "rename contact" device intent. Both apps replace the placeholder renderer with the same screens as register external address — `ContinueOnDevice` while the user confirms, and an `InfoState` per failure: rejection, wrong device, invalid data, OS version too low, and a generic error. A rejection keeps the job open so the user can retry on the same device.
