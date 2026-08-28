---
"ledger-live-desktop": minor
"@ledgerhq/live-common": minor
---

Add the Perps deposit signing step on desktop, reached from the review screen. It runs on the same swap orchestration as the `custom.exchange.swap` handler — now extracted into a shared `executeSwap` — behind the perps screens, and executes against the quote the review priced against. Declining a device prompt returns to the review with the entered amount intact, rather than raising an error screen.
