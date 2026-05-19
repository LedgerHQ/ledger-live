---
"live-mobile": minor
"@ledgerhq/device-intent": minor
---

Replace the catch-all `connectionError` executor state with a focused `deviceDisconnected` state entered only via the `DEVICE_DISCONNECTED` event. The `DeviceConnectionComponent` no longer receives `onError`; the LWM connection component now handles DMK-unavailable and defensive rxjs subscription failures internally by throwing to the nearest React `ErrorBoundary`.
