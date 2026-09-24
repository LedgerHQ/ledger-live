---
"ledger-live-desktop": patch
---

Add test IDs to the My Ledger values that automation has to read.

The device storage figures and the install success banner render their values as bare text nodes, so a test can see the containers but cannot assert what they show. This adds them to the used, capacity, apps count and free space figures in the storage card, and to the install success banner's title and its manage accounts button.

No behaviour changes: every addition is a `data-testid` attribute.
