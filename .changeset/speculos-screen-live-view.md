---
"@ledgerhq/live-e2e-shared": patch
"@ledgerhq/speculos-transport": patch
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Watch the Speculos screen during local E2E runs: `SPECULOS_SCREEN=web` opens the Speculos web page (through a local proxy that adds the Speculinho session token), `SPECULOS_SCREEN=vnc` a VNC viewer (through a local bridge to the Speculinho VNC websocket). Ignored in CI. Local Docker Speculos now always runs its VNC server, bound to 127.0.0.1.
