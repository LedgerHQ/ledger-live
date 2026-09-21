---
"live-mobile": patch
"@features/flow-app-lock": patch
---

Give a user protected by biometrics alone a way back when their face goes unread.

The unlock screen already retried the prompt when tapped, but nothing said so: with no password set, a face the camera never saw left the Ledger mark on black and no visible way forward. The whole screen being the button is no help to someone who cannot tell there is a button.

A real call to action now sits under the mark — "Unlock Ledger Wallet" — and it appears only once the prompt has gone. While the prompt is up the system dialog owns the screen, and at boot the bare mark is what keeps the handover from the launch screen invisible.

The other half is the OS's and already works: while its dialog is up, the device credential the app asks for makes iOS draw "Try Face ID Again" and "Enter Passcode" itself. It is only after that dialog is cancelled, when nothing will reopen it, that the app has to offer the way back.
