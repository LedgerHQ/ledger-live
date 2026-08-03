# @shared/cloud-sync

> **Status: UNSTABLE** — This package is incrementally shipping the validated WalletSync DDD architecture; API may change.

Generic cloud sync networking layer for Ledger Live wallet synchronisation.

Provides `CloudSyncSDK` — a protocol-agnostic client that fetches, uploads and deletes encrypted wallet state on the WalletSync atomic API, and listens for real-time push notifications via WebSocket. Encryption/decryption delegates to the caller's `TrustchainSDK` (compress → encrypt → base64 on write; reverse on read).

Also exports `getCloudSyncApi` (low-level fetch wrapper) and `makeCipher` (standalone encrypt/decrypt helper) for callers that need finer control.

Structural trustchain types (`Trustchain`, `MemberCredentials`, `TrustchainSDK`, …) are inlined here to keep `@ledgerhq/ledger-key-ring-protocol` out of this package's runtime deps.

## Related documentation

- [CloudSyncSDK](./../../docs/ledger-sync/04-cloud-sync-sdk.md) — cipher layers, atomic pull/push/delete, versioning
- [TrustchainSDK](./../../docs/ledger-sync/02-trustchain-sdk.md) — auth, members, key rotation (encryption key source)
- [The watch loop](./../../docs/ledger-sync/06-watch-loop.md) — how CloudSyncSDK drives push/pull cycles

## Code location

Moved from `libs/live-wallet/src/cloudsync/` to [`shared/cloud-sync/src/cloudsync/`](src/cloudsync/).
