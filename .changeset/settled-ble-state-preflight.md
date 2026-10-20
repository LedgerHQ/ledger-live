---
"@ledgerhq/live-dmk-mobile": minor
---

The Bluetooth discovery preflight now waits up to 3 s for the Bluetooth state to leave `Unknown` or `Resetting` before it reports an error. Before, turning off Bluetooth during a scan on Android could report `BluetoothStateUnknownCheckOnly` while the adapter was still turning off. The connect new device sheet then showed "Checking Bluetooth..." with no action.
