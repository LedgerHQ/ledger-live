---
"@shared/ui-queued-bottom-sheet": patch
"live-mobile": patch
---

Fix bottom sheets closing on their own while the user is still looking at them

Resolving a deeplink rewrites the navigation state, which blurs the hosting screen and refocuses it a frame or two later. Closing rode on an effect cleanup that React re-runs on every dependency change, so that momentary blur dismissed the sheet — the receive drawer and the transfer sheet both vanished mid-flow, leaving the user back on the portfolio. A blur is now confirmed before it is acted on, and each reason to close is explicit rather than implied by the cleanup, with unmount handled by its own teardown.
