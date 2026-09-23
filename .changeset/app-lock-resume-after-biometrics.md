---
"live-mobile": patch
"@features/flow-app-lock": patch
"@shared/ui-info-state": minor
---

Resume after a biometric prompt only once the app is active again, and let the enable button show it is waiting.

On iOS the system answers the prompt while the Face ID sheet is still leaving, with the app not yet back in the foreground, and native UI presented in that window never appears. The Card login hit it first: pressing Continue straight after enabling Face ID opened no browser, and the web browser module then refused every later attempt until the app was relaunched, because it had recorded a session that never started.

Every biometric prompt in the app now waits for the app to be active before answering, whatever the answer. The wait is bounded, so an event that never arrives cannot hold anyone up, and it does not apply to an app the user has sent to the background.

The system prompt also leaves the app pressable, so pressing "Enable Face ID" again while it was up opened a second one. The button now shows its spinner while the prompt is pending and ignores further presses. `InfoState` CTAs gain a `loading` flag for it.
