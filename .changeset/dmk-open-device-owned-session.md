---
"@ledgerhq/live-dmk-desktop": patch
---

Let `DeviceManagementKitTransport.open()` target a specific device.

It reused whatever session was live, so a caller wanting one device could be handed a transport bound to another — which then failed with a 404 the moment that other device went away. `open({ deviceId })` now reuses the active session only when it is that device's session, and reconnects otherwise. Called without an id it behaves exactly as before, so the app's transport module is unchanged.

Used by the mock server device swap, which reconnects onto the device it just attached rather than whichever one discovery happens to list first.
