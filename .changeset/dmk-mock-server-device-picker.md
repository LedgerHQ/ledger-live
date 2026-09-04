---
"@ledgerhq/live-dmk-desktop": minor
"ledger-live-desktop": minor
---

Let the mock server's device model, OS version and onboarded state be changed from the desktop developer settings, without restarting the app.

Three rows appear under the "Mock server transport" toggle while it is on: a model picker covering every model the Device Management Kit knows (Nano S, Nano S Plus, Nano X, Stax, Flex, Apex), an OS version input, and an "onboarded" switch. Turning the switch off makes the mock device report itself as not onboarded, which starts the mock server's onboarding simulation, so that flow can be exercised without a physical device. The OS version defaults to the latest build published for the model in the coin-apps catalogue and resets to it whenever the model changes, since a version only exists in one model's catalogue; setting a lower one leaves an OS update available, which is how the firmware update flow gets exercised.

A change is applied inside the live session rather than by tearing it down: the new device is attached and connected first, then the previous one is deleted. Ledger Live's own device session is dropped in between, since it holds a single one, and reopened against the new device *by id* — the mock transport lists both devices for as long as they coexist, so the plain "first available" reconnect would land back on the device being replaced. `DeviceManagementKitTransport.open()` therefore takes an optional `deviceId`; without one it behaves exactly as before.

`DeviceManagementKitTransport.listen` now reports each device under its own descriptor instead of `""`. Consumers key their device list by it — the desktop redux store dedupes and removes on it — so a shared empty descriptor collapsed every device into a single entry: attaching the swapped-in device was a no-op and deleting the swapped-out one emptied the list, leaving My Ledger stuck on "Connect and unlock your device". The descriptor is opaque to `open()`, which discovers on its own, so this also fixes two physical devices being seen as one.

Each model carries its real memory mask, so memory-aware device actions compute against the same constants as a physical device. The attached device carries no APDU mocks: the mock server derives the handshake and OS APDUs from this metadata itself, and a mock pinned on one of those prefixes freezes the reported device state. The choice is persisted, so a restart boots straight onto it; `MOCK_SERVER_SESSION` still seeds the session while no device has been picked.
