---
"ledger-live-desktop": minor
---

Adopt `@datadog/electron-sdk` to cover the Electron main process. Uncaught exceptions, unhandled rejections, and renderer crashes (`render-process-gone`) are now reported to Datadog, and `dd-trace` adds main-process resource/trace and renderer telemetry forwarding. Gated by the existing `sentryLogs` user opt-in; no new feature flag.

Bundle stack frames from the packaged asar are rewritten to `https://app.asar/…` before sending, so Datadog can match the uploaded source maps and unminify stack traces — both the renderer's `file://…/app.asar/.webpack/…` URLs and the main process's raw `/…/app.asar/.webpack/…` filesystem paths.
