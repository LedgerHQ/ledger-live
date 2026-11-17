---
"@ledgerhq/live-dmk-shared": patch
---

The connectDevice and connectNewDevice state machines start the disconnection of the other devices' sessions when they connect, so that Ledger Wallet keeps one DMK session at a time
