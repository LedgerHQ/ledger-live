---
"@ledgerhq/live-dmk-shared": patch
"@ledgerhq/live-dmk-mobile": patch
"live-mobile": patch
---

The transports, the BLE pairing and the OS update debug screen start the disconnection of the other devices' sessions when they connect, so that Ledger Wallet keeps one DMK session at a time
