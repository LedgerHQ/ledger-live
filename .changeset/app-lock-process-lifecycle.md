---
"live-mobile": patch
"@features/platform-app-lock": minor
---

Stop locking the app behind a permission prompt on Android.

React Native's `AppState` reports `background` on Android as soon as the activity pauses, and a permission dialog is enough to pause it, so the app lock read a prompt shown over the app as the user leaving. Granting the camera put the user back on the unlock screen instead of the camera.

On Android, the lock now follows the process lifecycle, which only stops once no screen of the app is visible — the signal native apps use for "the app went to the background". iOS keeps `AppState`, whose `background` already means the app has left. The platform split lives in one adapter, so the gate asks a single question on both.

`isAppBackgrounded`, which only the gate used, is removed from `@features/platform-app-lock`.
