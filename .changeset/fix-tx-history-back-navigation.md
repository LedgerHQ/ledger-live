---
"ledger-live-desktop": patch
---

Fix tx history back navigation when opened from the top bar. Pass the originating route as `historyBackPath`, accept any safe in-app return path, and pop the history stack on back instead of pushing a duplicate entry that trapped users between asset detail and tx history.
