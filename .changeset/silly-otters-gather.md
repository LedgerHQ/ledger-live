---
"@ledgerhq/live-dmk-shared": minor
"live-mobile": minor
"ledger-live-desktop": minor
---

Add the apply updates sub-step to the OS updates orchestrator, covering the OSU install, the MCU flash loop and the final firmware install

Wait out the device reboots each install and flash leaves behind, reconnecting under the same session id

Add the restore backup step, which runs as the last tenth of the bar when it follows an update and on its own when there is nothing left to update 

Sync `BASE_SOCKET_URL` to the DMK secure channel WebSocket URL
