---
"@ledgerhq/devices": minor
"@ledgerhq/hw-transport-webusb": patch
"@ledgerhq/hw-transport-webhid": patch
"@ledgerhq/hw-transport-node-hid-noevents": patch
"@ledgerhq/react-native-hw-transport-ble": patch
"@ledgerhq/hw-transport-web-ble": patch
---

Reduce the scope of `@ledgerhq/devices` to the devices list only. The transport framing helpers (`hid-framing`, `ble/sendAPDU`, `ble/receiveAPDU`) are inlined into the transports that use them and the corresponding subpath exports are removed.
