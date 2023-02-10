---
"live-mobile": patch
---

fix: double onClose with DeviceActionModal

Avoids multiple potential call to the `onClose` props by relying on `onModalHide` instead
