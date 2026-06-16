---
"live-mobile": minor
"@ledgerhq/device-intent": minor
---

Replace the DeviceIntentExecutor `cancellableUI` prop with the `ModalLock` pattern to control bottom sheet dismissability. The drawer is now locked (no close button, backdrop and pan-down disabled) while a device action is pending or in progress (unlock, allow secure connection, confirm open app, installing app, loading), and dismissable otherwise.
