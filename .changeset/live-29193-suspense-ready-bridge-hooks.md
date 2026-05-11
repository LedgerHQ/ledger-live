---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Refactor `useBridgeTransaction` to accept `bridge` as an explicit first argument
and initialise state synchronously via `useReducer`'s lazy initialiser, removing
the previous `use(Promise)` suspension path entirely.

All call sites in desktop and mobile updated to obtain the bridge via
`useAccountBridge` / `useAccountBridgeOrNull` and pass it as the first argument
to `useBridgeTransaction` (LIVE-29193).
