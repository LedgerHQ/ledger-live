---
"ledger-live-desktop": minor
"ledger-live-desktop-e2e-tests": minor
---

Run desktop E2E against Speculinho (remote Speculos). The app passes the Speculos address and session token to its Speculos transport at each open, and exposes `window.ledger.setSpeculosTarget` so a relaunched remote device (new URL and token) reaches the running app. The full desktop suite uses Speculinho, the smoke job does once its caller passes `SPECULINHO_URL`, and failed tests attach the Speculinho logs.
