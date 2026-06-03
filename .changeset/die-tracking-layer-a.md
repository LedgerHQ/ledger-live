---
"live-mobile": minor
---

Add Layer A (DIE) tracking events for the Device UX V2 plan: `deviceflow_started`, `device_prompted`, `device_connecting`, `device_connected`, `app_ready`, `deviceflow_completed`, and `deviceflow_aborted`. `DeviceIntentExecutorLWM` now requires a `sourceFlow` prop, exposed to descendants via a React context. The §4 `Page Connect Device - *` page events that accompany `device_prompted` and `device_connecting` are emitted declaratively from the visible UI components (`DiscoveringState`, `WaitingForSelectedDeviceState`, `ConnectingState`) via `TrackScreen`.
