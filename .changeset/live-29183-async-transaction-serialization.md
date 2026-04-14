---
"@ledgerhq/live-common": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

LIVE-29183: Make transaction serialization functions async in preparation for `loadTransactionForFamily` becoming async (dynamic import). Functions `fromTransactionRaw`, `toTransactionRaw`, `fromTransactionStatusRaw`, `toTransactionStatusRaw`, and `formatTransactionStatus` now return `Promise<T>`. All callers in desktop, mobile, CLI, and bot updated accordingly.
