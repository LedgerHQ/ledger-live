---
"@features/platform-intent-wallet-sync": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Build every Ledger Sync session SDK with the setup of the app's cached SDK, the one the wallet sync loop uses, through a shared `sessionWithDevice` adapter, so a member added on the device is known to the sync loop even when the flag environment arrives after the app started; the intents DevTool lists members with the app SDK again
