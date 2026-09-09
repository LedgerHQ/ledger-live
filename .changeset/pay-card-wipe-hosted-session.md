---
"ledger-live-desktop": minor
---

The provider's browser session no longer outlives the Card login. The Discover webview runs in the app's default session, which keeps cookies on disk, so a restart left the card holder still logged in at the provider and one click could mint a new code. A sign-in state that changes now ends that session: the main process removes the cookies for the hosts the Card manifests name and clears their origin storages. A cookie that Ledger shares across `ledger.com` stays, because the Card login does not own it.
