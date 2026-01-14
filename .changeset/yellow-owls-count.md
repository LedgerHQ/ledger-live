---
"@ledgerhq/live-common": minor
---

Added safer exchange error utilities: convertTransportError now uses INVALID_ADDRESS for CHECK_REFUND_ADDRESS step, and new getErrorName/getErrorMessage helpers read name/message (or nested causes) and handle string errors in libs/ledger-live-common/src/exchange/error.ts.
Swap server now wraps cancellation errors into CompleteExchangeError (defaults step to INIT), reports swap metrics using normalized name/message, rejects with the normalized error instead of StepError, and reuses getErrorName to detect drawer-closed cases in libs/ledger-live-common/src/wallet-api/Exchange/server.ts. Breaking change: CompleteExchangeError constructor signature changed from `constructor(step, message?)` (previously in SwapError.ts) to `constructor(step, title?, message?)` (in libs/ledger-live-common/src/exchange/error.ts), so the second parameter is now interpreted as a title rather than a message when two arguments are passed; external callers using the two-parameter form should update their usage accordingly.
