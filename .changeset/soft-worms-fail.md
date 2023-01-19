---
"live-mobile": patch
---

Rework of Bluetooth (and location for Android) services enable/disable management

On Android, location services that are necessary for BLE scanning are now handled by
a native module. It makes it easy to check and request the user to enable their location services.
