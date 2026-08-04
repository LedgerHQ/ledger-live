---
"ledger-live-desktop": patch
---

Move the remaining renderer IPC onto the preload bridge, in preparation for enabling `contextIsolation`.

App lifecycle, native dialogs, file operations, the screen-awake blocker and the `lld.json` store writes now go through named bridge methods instead of `ipcRenderer`. Channel names and main-side payloads are unchanged.

With this, no renderer module calls `ipcRenderer` at all. The only remaining `electron` imports outside main and the preload scripts are the three chokepoints introduced earlier — clipboard, `webFrame` and `shell.openExternal`, none of which are IPC — plus one type-only import.

Log export now checks whether the save dialog was cancelled. `showSaveDialog` always resolves to an object, so the previous `if (path)` guard was always true and the export ran on cancel, relying on the main process to ignore a cancelled target. The observable behaviour is unchanged; the check now says what it means.

