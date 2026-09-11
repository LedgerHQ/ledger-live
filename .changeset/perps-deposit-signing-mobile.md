---
"live-mobile": minor
---

Add the Perps deposit signing step on mobile, as a bottom sheet on the deposit screen that the review hands over to. It runs on the shared `executeSwap` orchestration behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.
