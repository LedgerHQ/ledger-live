---
"ledger-live-desktop": patch
---

Move the auto-updater and deep-link channels and the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

Updater status and deep links are pushed to the renderer through `on*` subscriptions that return an unsubscribe closure. App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

With this, the only renderer `ipcRenderer` call left is the Pay card PNG save, which moves onto the bridge with the other save dialogs in the next change. The only other `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.
