---
"live-mobile": patch
---

fix(notifications): request POST_NOTIFICATIONS on Android 13+

Firebase's `requestPermission` is a no-op on Android, so since #13457 the system notification
prompt was never shown on Android 13 and above: tapping allow opened App info and push
notifications stayed blocked. The app now requests `POST_NOTIFICATIONS` through
`PermissionsAndroid` on Android 13+, and only opens the settings once the permission can no
longer be requested.
