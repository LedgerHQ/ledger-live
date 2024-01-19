---
"ledger-live-desktop": minor
---

Feat: refactor on the IPC Transport logic

Simpler implementation of the Transport logic using Electron IPC
in order to have a 1 <-> 1 relationship between the transport living
on the `renderer` process and the transport living on the `internal` process
