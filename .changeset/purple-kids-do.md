---
"@ledgerhq/react-native-hw-transport-ble": patch
---

fix: request for a specific MTU when trying to BLE connect

ConnectionOptions was commented as "not used" in react-native-ble-plx,
but it is actually used and needed when connecting to a device.
