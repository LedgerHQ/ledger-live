---
"@ledgerhq/live-dmk-shared": patch
---

Fix sticky user interaction state in EnsureAppReady pending mapping: when ConnectApp reports `UserInteractionRequired.None` without an install plan, emit a generic loading state instead of returning null so the UI no longer remains stuck on the previous interaction prompt.
