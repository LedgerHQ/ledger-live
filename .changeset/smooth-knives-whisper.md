---
"@ledgerhq/coin-aleo": minor
---

Aleo now exposes its record-scanner scan status through `getAccountInfo`, so consumers can read sync progress from the shared API instead of digging into coin-module internals. Returns `{ type: "none" }` when the account isn't enrolled yet.
