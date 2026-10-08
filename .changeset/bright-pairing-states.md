---
"live-mobile": minor
---

Implement the final Discovering, Connecting and Connected views of `ConnectNewDevice`, on a true black background. The animations come from the Figma Symbols Library in a light and a dark version, and they include their animated spot. The Discovering copy and animation depend on the scanned transports: Bluetooth, Bluetooth and USB, or USB only. Each discovered device shows in a card with a Connect button. For a USB device, the Connecting and Connected views say "connecting" and "connected" instead of "pairing" and "paired".

The Connect New Device debug screen now mounts the component alone, as a caller does, and unmounts it when `onConnected`, `onDeviceNotFound` or `onClose` ends the flow. Its log also shows each mount and unmount.

`onDeviceNotFound` is now optional: the "I don't see my device" button shows only when the caller passes it.

A Connect New Device animations debug screen previews each of these Lotties, in the light and the dark theme.
