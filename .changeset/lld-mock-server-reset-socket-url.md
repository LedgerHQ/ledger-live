---
"ledger-live-desktop": patch
---

Reset `BASE_SOCKET_URL` when the mock server transport is turned off.

`bootstrapMockServerTransport` pushed the mock server's secure channel to all threads when enabled, but returned early when disabled. The internal thread is not reloaded by `reloadRenderer`, so the override survived and kept the legacy scriptrunner flows (genuine check, list apps, install, firmware/MCU) pointed at the mock server after the toggle was off. Only a url carrying `/secure-channel/` is reset, so a deliberate `BASE_SOCKET_URL` override is left alone.
