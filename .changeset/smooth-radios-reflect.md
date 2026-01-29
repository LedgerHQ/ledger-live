---
"live-mobile": patch
"@ledgerhq/live-common": patch
---

Remove legacy React Native BLE transport code

Since the `ldmkTransport` feature flag is now enabled by default in all environments, the Device Management Kit (DMK) transport is always used. This removes all dead code related to the legacy BLE transport:

- Removed `@ledgerhq/react-native-hw-transport-ble` dependency from LLM
- Removed `PairDevices` screen and related components
- Removed `DebugBLE` and `DebugBLEBenchmark` debug screens
- Removed legacy BLE hooks (`useBleDevicePairing`, `useBleDevicesScanning`) from live-common
- Removed legacy BLE types from live-common

Note: The `@ledgerhq/react-native-hw-transport-ble` package itself (in `libs/ledgerjs/`) is not removed — it will be deprecated in a separate PR.
