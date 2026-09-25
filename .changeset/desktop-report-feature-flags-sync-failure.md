---
"ledger-live-desktop": patch
---

fix(feature-flags): report a re-resolution that throws

A feature-flags re-resolution that throws is now always reported through `logger.critical`,
whatever the state of the remote-flag cache.
