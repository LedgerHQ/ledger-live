---
"ledger-live-desktop": minor
---

Move the desktop renderer's last Electron chokepoints (clipboard, `webFrame`, `shell.openExternal`) onto the preload bridge, and run the save dialogs in the main process. Main now keeps the chosen path for the log export, the operations CSV export and the Pay card PNG save, so the renderer can no longer hand an arbitrary path back to be written. The write handlers return `"saved" | "canceled" | "failed"`, so cancelling an export is no longer reported as an error. Main registers every IPC handler through the shared `CHANNELS` contract.
