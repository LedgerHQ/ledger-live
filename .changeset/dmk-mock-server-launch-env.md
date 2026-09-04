---
"ledger-live-desktop": patch
---

Let a launch env turn the mock server transport on, so e2e can drive it.

`bootstrapMockServerTransport` restored the developer toggle from localStorage unconditionally, which overwrote `MOCK_SERVER_TRANSPORT=1` back to false on a fresh profile — the transport could only ever be enabled by clicking the toggle. The launch value now wins when it is non-default, and localStorage is only consulted otherwise, which is what the toggle relies on (it resets the env on reload and persists its state there).
