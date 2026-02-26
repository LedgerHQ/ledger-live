---
"@ledgerhq/live-common": patch
---

Fix onboarding polling error when device is in bootloader mode: call getVersion first and handle both CLA_NOT_SUPPORTED and INS_NOT_SUPPORTED errors to trigger quitApp only when an app is intercepting
