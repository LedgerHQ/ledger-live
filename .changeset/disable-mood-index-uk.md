---
"@ledgerhq/live-common": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Disable the Mood index (Fear & Greed) for users in the UK on both mobile and desktop, based on the device region (same mechanism as the Earn APY). Adds a shared `isMoodIndexAvailable` helper and hides the Mood index card/tile from the Market screen and the Market banner when the region is "GB".
