---
"ledger-live-desktop": patch
---

The desktop app's own device animations are code-split per device model and loaded lazily instead of being read back through a runtime `require()`. The shared pin/continue animations are still bundled with the renderer.
