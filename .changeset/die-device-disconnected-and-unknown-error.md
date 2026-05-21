---
"live-mobile": minor
"@ledgerhq/device-intent": minor
"@ledgerhq/live-dmk-mobile": minor
---

Tighten the Device Intent Executor error model:

- Replace the catch-all `connectionError` executor state with a focused `deviceDisconnected` state entered only via the `DEVICE_DISCONNECTED` event. The `DeviceConnectionComponent` no longer receives `onError`, and `ExecutorPlatformConfiguration` requires a `DeviceDisconnectedComponent` in place of the previous `ConnectionErrorComponent`.
- Funnel any unexpected error escaping the inner connect-device state machine into a new terminal `UnknownError` `ConnectDeviceUIState` via a `catchError` wrapper in `connectDeviceUseCase`, so the observable's error channel is never reached in normal operation.
- Add a `UnknownErrorState` component in the LWM connection view that renders the shared `intentError` wording for this terminal state.
