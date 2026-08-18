---
"@features/platform-app-lock": minor
"@features/flow-app-lock": minor
"live-mobile": minor
---

Rework the app lock behind `lwmPasswordRevamp`. The password is no longer kept in the keychain and compared with `===`: only a scrypt verifier is stored, checked in constant time, so a password read off the device no longer opens the app. Existing plaintext passwords migrate on the next successful unlock — the verifier is written and proven to open before the old entry is destroyed, so an interrupted migration always leaves a way in.

Adds the screens the revamp needs: add, confirm, deactivate and unlock, plus the demand for a longer password from users whose password predates the six-character minimum, and the sheet explaining that a lost password means reinstalling.

Biometric unlock no longer requires a password. It can be turned on by itself, is asked for before the unlock screen draws anything, and accepts the device passcode so a face that stops being recognised cannot shut its owner out.

The lock also locks for biometrics-only users, which it never did, and no longer locks itself when iOS reports the app merely inactive — the state that a biometric prompt puts it in.
