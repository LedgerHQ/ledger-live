---
"@ledgerhq/live-common": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@ledgerhq/live-cli": minor
---

chore(live-common): async prep — account serialization & sign chain (LIVE-29184)

Make `fromOperationRaw`, `toAccountRaw`, `canSend`, `toScanAccountEventRaw`, `encodeModel`, `getConcordiumBridge`, `fromSignedOperationRaw`, `fromSignOperationEventRaw`, `serializePlatformSignedTransaction`, and `deserializePlatformSignedTransaction` return Promises. All call sites across desktop, mobile, CLI, and live-common are updated to await the new async signatures. This is a no-op at runtime (bridges are still synchronous); the change prepares the codebase for `getAccountBridgeByFamily` becoming async.
