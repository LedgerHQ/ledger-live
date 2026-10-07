---
"ledger-live-desktop": patch
---

Remove the HTTP proxy device transport (`DEVICE_PROXY_URL`) from the desktop app, together with its IPC transport and the `window.lld.transport` bridge. Real devices and Speculos connect from the renderer through the Device Management Kit.
