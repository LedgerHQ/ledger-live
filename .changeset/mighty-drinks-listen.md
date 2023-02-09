---
"live-mobile": patch
---

fix: several bugs on new system of queued drawers

- QueuedDrawer is forcefully cleaned only if lost focus AND the drawer was trying to be opened
- For a consumer drawer: onClose needed even if noCloseButton was set to handle lost of screen focus or if other drawer forced it to close
