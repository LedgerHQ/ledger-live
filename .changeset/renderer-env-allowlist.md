---
"ledger-live-desktop": patch
---

Pass the desktop renderer only the environment variables it reads: the `@shared/env` definitions (except `SEED`), the build-time Card values and a short list of debug and E2E flags. The production build now fails when the renderer reads a variable that is not on the list.
