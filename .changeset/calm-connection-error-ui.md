---
"live-mobile": patch
---

Move the discovery, connection and unknown error UI of the Device Intent Executor to `mvvm/components/DeviceConnection`, so that connectNewDevice can reuse it. The moved components take the shared connectivity UI states and do no tracking. The executor keeps thin containers that add the screen and button tracking. The UI and the analytics events are unchanged.
