---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-mobile": minor
---

Add `connectNewDeviceUseCase`, which exposes the connectNewDevice state machine as an `Observable` of UI states, and the mobile `connectNewDevice`, which discovers on RN_BLE and Speculos on iOS and also on RN_HID on Android.
