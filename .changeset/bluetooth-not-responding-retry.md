---
"live-mobile": minor
---

The discovery error for an undetermined Bluetooth state (`BluetoothStateUnknownCheckOnly`) no longer shows a spinner with no action. It now shows "Bluetooth isn’t responding" with a retry CTA and, on Android, the "Continue with USB instead" CTA. Before, nothing checked the Bluetooth state again, so the sheet stayed stuck.
