---
"live-mobile": minor
"@features/flow-app-lock": minor
---

Offer biometrics on the unlock screen with the symbol the device actually uses.

The field asked for biometrics with a generic touch symbol, because Lumen had no biometric one when the screen was built. It has since gained `FaceId` and `Fingerprint`, so a face device now shows a face and a fingerprint device a fingerprint.

The device reports six kinds and there are two symbols: a touch is a fingertip on either platform, and everything the device reads from the face — iris and Optic ID included — takes the face symbol, since there is no iris symbol and an eye read is nearer a face than a fingertip. The capability is read asynchronously while the affordance comes from stored state, so the generic touch symbol still stands in for the moment before the device has answered, and for a read that fails.
