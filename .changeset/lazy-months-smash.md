---
"ledger-live-desktop": patch
---

feat: enable printing logs to stdout for debug and record logs from internal thread

- Logs from the internal thread are forward to the main thread
- The main thread records them, and can export them
- If `VERBOSE` env var is set, filtered logs can be stdout from the main thread
- Same from the renderer thread
- Setup simple tracing system (context) on LLD
