---
"ledger-live-desktop": patch
"live-mobile": patch
---

Save the CAL token cache after a changed sync hash evicts stale tokens, including when no tokens remain, and on mobile also when the check ends before the saver mounts, so the next launch does not restore them.
