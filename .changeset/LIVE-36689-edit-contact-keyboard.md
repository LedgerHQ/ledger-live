---
"@shared/ui-queued-bottom-sheet": patch
"live-mobile": patch
---

Fix the keyboard disappearing instantly when editing a contact name on Mobile. A bottom sheet retracts the keyboard when its close begins, but it also did so again when its dismissal finally landed — by then the sheet that replaced it (here, the rename drawer) had already raised the keyboard for its own field, so the late retraction stole it. A dismissal now only retracts the keyboard when it bypassed the close animation entirely.
