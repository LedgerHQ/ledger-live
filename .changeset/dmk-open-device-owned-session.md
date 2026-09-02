---
"@ledgerhq/live-dmk-desktop": patch
"ledger-live-desktop": patch
---

Only reuse a DMK device session when it belongs to the device that was asked for.

`DeviceManagementKitTransport.open()` reused whatever session was live, and the desktop transport module threw away the device id it was given, so a job for one device could be handed a transport bound to another. With two devices present the app connected to the wrong one — reporting a Nano X while exchanging APDUs with a Flex — and every job on that session died with a 404 the moment the other device went away, surfacing as `Cannot read properties of undefined`.

`open()` now takes the device id into account: the active session is reused only when it is the session of that device, and a different device triggers a reconnect. Called without an id it behaves as before.
