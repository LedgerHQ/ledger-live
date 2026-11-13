---
"@ledgerhq/live-dmk-shared": minor
---

Add `isRunning` and `ignoredTransportIds` to `DeviceDiscoveryService`, and make the connect device and connect new device state machines read the discovery state from the service, so that two state machines can share one service
