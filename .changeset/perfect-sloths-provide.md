---
"ledger-live-desktop": minor
---

Add analytics tracking for the Market page and global asset discoverability. Tracks search open/query/asset-clicked events from the global search overlay, sort and "see all" interactions, market banner ranking changes, and a dedicated discoverability TrackPage payload. Introduces a shared `marketPageAnalytics` util and `screenRefs` helpers for resolving current/previous tracking page names.
