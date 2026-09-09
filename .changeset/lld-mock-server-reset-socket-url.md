---
"ledger-live-desktop": patch
---

Reset `BASE_SOCKET_URL` when the mock server transport is turned off, so the legacy scriptrunner flows stop pointing at the mock server.
