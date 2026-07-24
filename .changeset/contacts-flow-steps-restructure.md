---
"@features/flow-contacts": patch
"ledger-live-desktop": patch
"live-mobile": patch
---

Reorganize the contacts flow package around a /steps folder (List, AddContact, Introduction, Detail), promote shared helpers to src/utils, curate root barrels, and rename public views to ContactsListView and ContactDetailView. No runtime behavior change.
