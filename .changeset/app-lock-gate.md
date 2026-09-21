---
"@features/platform-app-lock": minor
"live-mobile": minor
---

Hold the app behind the lock on boot and when it comes back from the background, behind `lwmPasswordRevamp`.

`AppLockGate` sits above the app, decides once on boot whether protection is configured, and locks again whenever the app is backgrounded. The unlock screen renders over the app rather than replacing it, so nothing below unmounts and the user lands where they left off.

Two details carry more weight than they look:

The protection state is read back from the keychain at startup — until now it only lived in memory, so a relaunch reported no password at all. The Settings row renders nothing until that read answers, rather than showing "off" and correcting itself a moment later. A read that fails counts as protected: the app would otherwise open itself on a keychain error.

Backgrounding is judged per platform. On iOS only `background` locks, because the biometric prompt itself pushes the app to `inactive` — locking there would mean the prompt locks the app it was about to open.

Which path the app takes is decided by the stored state, not only by the flag: a user who already holds a verifier keeps the revamped screens even if `lwmPasswordRevamp` is rolled back, since the legacy ones cannot remove it and ignoring it would silently drop their protection. That resolved scheme now governs the add and modify navigators too, which read the raw flag until now — on a rollback they sent a verifier holder to the legacy removal screen, which clears the legacy keychain entry and leaves the verifier in place, so the lock could not be turned off.

Removing the last protection also releases the lock. A removal takes a slow derivation, and backgrounding during it locks the app; the removal then destroyed the verifier while the lock stood, leaving an unlock screen with nothing left to open it.

While that read is in flight the app is covered rather than shown: the state starts unlocked, so rendering it would hand the app to whoever holds the phone for as long as the keychain takes. Once locked, the app below stays mounted — unlocking returns the user where they were — but leaves the accessibility tree, or a screen reader would walk into it.
