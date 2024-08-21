---
"@ledgerhq/logs": minor
"@ledgerhq/hw-transport-node-hid-noevents": patch
"@ledgerhq/react-native-hw-transport-ble": patch
"ledger-live-desktop": patch
---

Remove withType method on `LocalTracer` because it was being overused, causing memory overloads.
