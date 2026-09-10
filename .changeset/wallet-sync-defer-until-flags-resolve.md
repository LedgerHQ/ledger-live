---
"ledger-live-desktop": minor
"live-mobile": minor
---

fix(wallet-sync): start Ledger Sync only once the feature flags have resolved

`WalletSyncProvider` mounted its watcher on the first render, which reaches `useTrustchainSdk`.
That hook builds its SDK once and keeps it for the whole session, so running it before the flags
resolved pinned the SDK, and the Keycloak environment with it, to whatever the compiled defaults
said. On mobile this was reachable on any cold start slower than `WaitForAppReady`'s one-second
bypass.

The watcher now mounts only once `remoteFlagsReady` is set. `children` stays outside the
condition, so the app subtree is never remounted when readiness flips.
