---
"dummy-wallet-app": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@ledgerhq/live-common": patch
---

fix: recover restore and onboarding issues

Fix desktop LNX onboarding back when coming from recover
Skip genuine check when coming from recover to restore the device (it would be better to allow unseeded device on the genuine check screen instead)
Send the deviceId to the recover app in order to avoid multiple device selection during the restore process
Update the podfile to config the build settings with ccache support (You might need to check https://stackoverflow.com/a/70189990 for ccache to work correctly when building with xcode)
Cleanup old RecoverStaxFlow screen
Patch react-native-webview to add support for `allowsUnsecureHttps`
Added `IGNORE_CERTIFICATE_ERRORS=1` to use `allowsUnsecureHttps` in the webview in dev same as for LLD
Added `protect-local` & `protect-local-dev` manifest support in dev
Update wallet-api dependencies
