---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Refactor `useBridgeTransaction` to accept a pre-resolved `AccountBridge` as its
first argument. The hook no longer calls `getAccountBridge()` during initialisation;
callers are responsible for supplying the bridge (typically via `useAccountBridge`).
`setAccount` also now takes an explicit bridge as third parameter.

All call sites in desktop and mobile are updated accordingly.
