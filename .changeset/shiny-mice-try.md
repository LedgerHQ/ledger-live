---
"live-mobile": patch
---

fix: manager possible duplicated ble requirements error messages

In the Manager: both the old (SelectDevice) and new (SelectDevice2)
device selection components handle the bluetooth requirements with a hook

- bottom drawer.

The fix gives back the responsibilities to those select components to check for
the bluetooth requirements and avoids a duplicated error drawers/messages.

The only drawback: the user has to select again their device once the bluetooth
requirements are respected.
