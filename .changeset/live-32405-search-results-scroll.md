---
"ledger-live-desktop": patch
---

Cap the top-bar global search results to 5 visible crypto rows in a fixed-height, scrollable list. Results now load progressively as the user scrolls (infinite scroll) via DADA cursor pagination instead of being hard-capped at 10, so the popover no longer grows to fit every result.
