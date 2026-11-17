---
"@ledgerhq/live-dmk-shared": patch
---

The connectDevice and connectNewDevice state machines start the disconnection of the other devices' sessions when they connect, so that Ledger Wallet keeps one DMK session at a time. The connectNewDevice state machine uses the open session of the selected device instead of opening a second one
