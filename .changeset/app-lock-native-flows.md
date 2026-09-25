---
"live-mobile": patch
"@features/platform-app-lock": minor
---

Stop locking the app on Android for flows the app itself starts.

Clearing the cache reboots the React tree without restarting the process, and the gate took its remount for a launch and locked again. Whether the launch lock was decided now lives in the app-lock state, which a reboot leaves in place, so it is decided once per process.

Sharing an address or logs, or saving a file from the share sheet, hands the screen to another app, which Android reports as the app leaving. Those flows now go through `leaveAppFor`, which holds the background lock off until Android resumes the app. The share promise settles before the user is back, so the hold ends on the resume rather than on the promise, and at once if the task fails before anything was shown. iOS keeps its share sheet inside the app and is unaffected.
