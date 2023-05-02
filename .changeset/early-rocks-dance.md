---
"live-mobile": patch
---

Fix: new device selection dynamic header issues

This PR fixes the "double header" that could be rendered when using the new device selection + ble pairing flow and different screens on LLM.

To do this, it introduces:

a requestToSetHeaderOptions in BleDevicePairingFlow / SelectDevice2
this callback notifies the screen consuming SelectDevice2/BleDevicePairingFlow that it needs to update its header AND notifies it when it can put back its initial header
the consumer screen can decide to do nothing, and keep its header (case by case)
It also makes the bottom tab/menu bar disappear during the ble pairing flow with the new device selection.

Finally, it removes an unnecessary styles.header on ManagerNavigator that would, on iOS, create a thin visible line on the top header on the manager screen.
