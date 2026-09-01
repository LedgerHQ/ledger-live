---
"ledger-live-desktop": minor
---

Stop `logger.critical` from reporting non-Error values to Datadog, where they collapsed into unsearchable `"null"` and `"[object Object]"` issues merged across unrelated callers. Such values are still kept in the local logs.
