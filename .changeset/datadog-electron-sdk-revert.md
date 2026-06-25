---
"ledger-live-desktop": minor
---

Revert the `@datadog/electron-sdk` main-process integration (#17844) due to boot-time issues. The Electron main process no longer initializes Datadog/dd-trace; renderer Datadog reporting is unchanged. The asar source-map URL rewrite in the renderer `beforeSend` is kept.
