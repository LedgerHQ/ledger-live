---
"live-mobile": minor
---

Fix duplicate `contentcard_impression` events: keep `InViewContext` visibility memory keyed by the stable target ref so impressions no longer re-fire when a content card re-subscribes (e.g. carousel rebuilding its items) while still in view
