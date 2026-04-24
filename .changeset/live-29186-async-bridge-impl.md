---
"@ledgerhq/live-common": minor
---

chore(live-common): async prep — getAccountBridge and getCurrencyBridge (LIVE-29186)

Prepare all async callers of `getAccountBridge` and `getCurrencyBridge` to `await` the result.
Functions remain synchronous for now; the `async` keyword will be added in the follow-up PR.
