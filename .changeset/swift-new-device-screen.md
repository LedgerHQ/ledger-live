---
"live-mobile": minor
---

Add the `ConnectNewDevice` component. It runs connectNewDevice, shows one view for each UI state and shows the discovery, connection and unknown errors in a bottom sheet over the last view. The Discovering, Connecting and Connected views are placeholders. The device intent executor and `ConnectNewDevice` now save the connected device with the same `useSaveConnectedDevice` hook. `ConnectNewDevice` also adds a new Bluetooth device to the BLE known devices.
