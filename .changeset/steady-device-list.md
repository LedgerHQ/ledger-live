---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-mobile": minor
---

The connectNewDevice `Discovering` UI state now keeps the devices in the order in which they were first discovered. A device that discovery no longer reports stays at its position with `isAvailable: false` and no `onSelect`. It becomes available again at the same position when discovery reports it again. The state machine takes a new `getDiscoveredDeviceKey` input to identify a device from one discovery update to the next: on mobile, a Bluetooth device by its id and a USB device by its model.
