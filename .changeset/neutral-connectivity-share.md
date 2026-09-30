---
"@ledgerhq/live-dmk-shared": minor
"@ledgerhq/live-dmk-mobile": minor
"@ledgerhq/live-dmk-desktop": minor
"live-mobile": patch
"ledger-live-desktop": patch
---

Extract the device discovery service and the connectivity types shared by device connection flows into a `deviceConnectivity` folder. The discovery, connection and unknown error UI states now use the shared `ConnectivityUIStateTypes` enum. `ConnectDeviceUIStateTypes` becomes a const object that includes these shared members, so type positions use `typeof ConnectDeviceUIStateTypes.X` or the new `ConnectDeviceUIStateType` type. The device type moves to the shared part as `Device`, and connectDevice keeps `KnownDevice` as an alias of it. connectDevice behaviour is unchanged.
