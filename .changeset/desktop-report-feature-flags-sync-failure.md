---
"ledger-live-desktop": minor
---

fix(feature-flags): report a re-resolution that throws

A feature-flags re-resolution that throws at boot is now reported through `logger.critical`,
whatever the state of the remote-flag cache.
