---
"live-mobile": patch
---

feat: flexible bluetooth requirements check and request with drawer and hook

Possible more fine-grained requirements check and request (only for BLE connecting, or also BLE scanning) with the usage of useRequireBluetooth + RequiresBluetoothDrawer

Centralized the generic UI of the drawer content in GenericInformationalDrawerContent

Implemented drawer + hook bluetooth requirements check and requests for:

- current device selection component
- new device selection component
- SkipSelectDevice component which automatically select the last connected device

Also added a debug screen for bluetooth requirements check and request
