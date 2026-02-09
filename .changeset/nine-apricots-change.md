---
"live-mobile": minor
---

fix: prevent double-firing of close animation callbacks in QueuedDrawer and DeviceConnect

Use refs instead of local variables in QueuedDrawer's closeAnim to
deduplicate callbacks across rapid successive calls. Add a guard ref
in DeviceConnect to prevent handleSuccess from executing twice.
