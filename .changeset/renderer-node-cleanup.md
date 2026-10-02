---
"ledger-live-desktop": patch
---

Prepare the desktop renderer for running without Node integration: remove dead IPC channels and Node-only globals (`global.localStorage`, `setImmediate` in the post-onboarding redirect), replace winston in the renderer with a minimal logger of the same surface, route clipboard, `webFrame`, dialogs and `os` through single-purpose modules, import and export local Live App manifests with a file input and a download instead of the filesystem, and give the dev-only Firebase diagnostic its per-project configs from the build instead of reading `.env` files at runtime. No behaviour change.
