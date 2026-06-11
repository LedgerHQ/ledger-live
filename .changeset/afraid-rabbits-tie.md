---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Add a favorites ranking to the desktop Market Banner. The banner now switches between the trending performers list and the user's starred market coins, fetching favorites via `useMarketData` (availability filtering bypassed so starred coins always show) and disabling whichever query is inactive.
