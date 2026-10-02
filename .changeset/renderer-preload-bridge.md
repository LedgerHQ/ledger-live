---
"ledger-live-desktop": minor
---

Add an explicit, allow-listed preload bridge (`window.lld`) for the desktop renderer, declared once in `src/bridge/contract.ts` and imported by both sides. Main captures a bootstrap snapshot (env, `os`, paths, distribution channel) that the renderer reads synchronously, `electron-store` moves into the main process, and the Datadog anonymizer reads its paths from the snapshot. The `CARD_SESSION_BOOTSTRAP` credential is kept out of the snapshot and handed over once per page load. The renderer still runs with `nodeIntegration` on; the bridge works in both modes, so this changes no behaviour on its own.
