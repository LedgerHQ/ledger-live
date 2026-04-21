---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Add `useAccountBridge` hook leveraging React `use()` to suspend while the bridge
module loads asynchronously. Refactor `useBridgeTransaction` so its init callback
can be async and the initial state is resolved via `use()` before first render,
removing the synchronous `getAccountBridge` call from the reducer. All call sites
updated to `async` init with `await getAccountBridge()`.

Requires a `<Suspense>` boundary in the parent tree (LIVE-29193).
