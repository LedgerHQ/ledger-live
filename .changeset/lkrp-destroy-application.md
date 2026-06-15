---
"@ledgerhq/hw-ledger-key-ring-protocol": minor
"@ledgerhq/ledger-key-ring-protocol": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/web-tools": minor
---

feat(lkrp): per-application close on Wallet Sync deactivation

Deactivating Wallet Sync now closes only the current application's stream instead of destroying the whole trustchain root, so other applications sharing the same root (e.g. wallet-cli `ring`) keep working. If the application being closed is the last open one, the whole trustchain is still destroyed (previous behaviour).

- `CommandStreamResolver` now observes `CloseStream` (`ResolvedCommandStream.isClosed()`).
- `StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate application streams to detect the last open application.
- New `TrustchainSDK.destroyApplication()` primitive, software-key signed (no hardware device): closes only the current application's stream, or destroys the whole trustchain when it is the last open application (`{ trustchainDestroyed }`).
- `restoreTrustchain` throws `TrustchainEjected` when the application stream is closed, and `getOrCreateTrustchain` reopens on the next index after a close.
- LLD/LLM `useDestroyTrustchain` hooks now call `destroyApplication`.
- web-tools trustchain playground exposes a `sdk.destroyApplication` action to exercise the per-application close.
