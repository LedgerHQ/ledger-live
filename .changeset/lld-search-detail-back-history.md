---
"ledger-live-desktop": patch
---

Fix: searching from the global search overlay while already on an asset or market detail page now replaces the current history entry instead of pushing a new one. A single Back press returns to the page visited before the first search, so repeated searches no longer stack up in the navigation history.
