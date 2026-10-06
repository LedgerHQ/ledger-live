---
"@ledgerhq/live-dmk-shared": minor
---

Add the connectNewDevice state machine. It discovers devices, lets the user select one, connects to it, and reports the result, with a device not found delay and a success delay. `DeviceDiscoveryService` now exposes the `transportIds` it discovers on.
