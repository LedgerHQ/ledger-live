---
"live-mobile": patch
"@ledgerhq/live-env": patch
---

feat: enable printing logs to stdout for debug

- Setup simple tracing system on LLM with context
- If `VERBOSE` env var is set, filtered logs can be stdout from the main thread
