---
"@ledgerhq/devices": minor
"@ledgerhq/hw-transport-webusb": minor
"@ledgerhq/hw-transport-webhid": minor
"@ledgerhq/hw-transport-node-hid-noevents": minor
"@ledgerhq/react-native-hw-transport-ble": minor
"@ledgerhq/hw-transport-web-ble": minor
---

Reduce the scope of `@ledgerhq/devices` to the devices list only. The transport framing helpers (`hid-framing`, `ble/sendAPDU`, `ble/receiveAPDU`) are inlined into the transports that use them and the corresponding subpath exports are removed.
