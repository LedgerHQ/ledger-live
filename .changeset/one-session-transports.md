---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-mobile": minor
"live-mobile": minor
---

The transports, the BLE pairing and the OS update debug screen start the disconnection of the other devices' sessions when they connect, so that Ledger Wallet keeps one DMK session at a time. The BLE and USB transports also reuse the session of a connected device before they scan
