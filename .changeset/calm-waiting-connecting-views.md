---
"live-mobile": patch
---

Move the waiting and connecting views of the Device Intent Executor to `mvvm/components/DeviceConnection`, so that the device list can reuse them. The waiting view takes a `Device`, the connecting view takes no props, and neither does tracking. The executor keeps thin containers that add the screen tracking. The UI and the analytics events are unchanged.
