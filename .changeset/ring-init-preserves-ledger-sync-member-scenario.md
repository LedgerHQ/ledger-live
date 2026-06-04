---
"@ledgerhq/ledger-key-ring-protocol": patch
---

Add `ringInitPreservesLedgerSyncMember` SDK e2e scenario covering the trustchain-backend behaviour where deriving a new application id (17, used by wallet-cli `ring init`) must not evict members previously added under another application id (16, used by Ledger Sync). The scenario asserts the Ledger Sync member is preserved after the ring derivation; the committed snapshot is recorded against the fixed backend.

`sdkForName` in the scenario harness now accepts an optional `applicationId` so a single scenario can exercise multiple derivation apps from the same device. The recorder captures request bodies at `request:start` (they are already consumed by `response:bypass`), decodes compressed response bodies before storing them, and excludes speculos loopback traffic from the snapshot.
