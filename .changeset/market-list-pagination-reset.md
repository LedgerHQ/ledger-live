---
"ledger-live-desktop": minor
---

Fix Market list pagination and scroll position when switching lists (category, sort, range, search, filter): re-arm the pagination guard and reset scroll to the top on list identity change, and detect the end of every list type by tracking whether new rows arrived
