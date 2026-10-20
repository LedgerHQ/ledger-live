---
"@ledgerhq/live-e2e-shared": minor
"@ledgerhq/speculos-transport": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Watch the Speculos screen during local E2E runs: `SPECULOS_SCREEN=web` opens the Speculos web page (through a local proxy that adds the Speculinho session token), `SPECULOS_SCREEN=vnc` a VNC viewer (through a local bridge to the Speculinho VNC websocket). Ignored in CI. Local Docker Speculos now always runs its VNC server, bound to 127.0.0.1.
