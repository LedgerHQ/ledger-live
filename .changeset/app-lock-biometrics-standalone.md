---
"@features/platform-app-lock": minor
"@features/flow-app-lock": minor
"live-mobile": minor
---

Make biometrics a protection in its own right: password and biometrics become independent, and either one alone is enough to lock the app.

Biometrics used to require a password. Its Settings row was disabled until one existed and reset itself whenever the password went away, and the legacy lock returned early without a password, so a biometrics-only user was never locked at all. The revamped path now derives the lock from both protections, so enabling biometrics alone locks the app — and Settings offers it with no password set.

The row is hidden where the device has no biometrics, or has the hardware with nothing enrolled, rather than shown disabled: there is nothing the user could do about it from that screen.

Biometrics is asked for **before** the unlock screen draws a field, so it is the first thing the user meets and the password is the fallback. While the prompt is up the screen stands in for the splash, with the mark at the splash's own size so the handover moves nothing. Only a refusal reveals the password field — and a user protected by biometrics alone never sees it: pressing the screen asks again, which is their only way in.

The prompt is an explicit owner check through `BiometricPrompt` / `LAContext`, not a side effect of reading a protected keychain item. A biometry-gated read can resolve without the OS ever showing anything, and Android reports a correct device PIN as a success the keystore item cannot consume — either way the caller is told the user proved something they were never asked for. On Android 11 and above the OS draws its own "use PIN" button in place of the negative one, and every label it shows comes from the app rather than the library's English defaults.

The keychain item is therefore a plain marker, not an authentication step: it records that biometrics is on, which the protection state cannot do on its own, being held in memory only. Enabling proves before it records, and a refusal stores nothing.

The device credential is accepted, because biometrics can now be the only protection: a lockout after failed attempts would otherwise leave the owner with nothing to try. The consequence to accept is that someone who knows the device passcode can open the app — for a user who also set a password, the weaker path.

Protection that outlived its install is destroyed at boot. iOS keeps keychain items when an app is deleted while Android wipes them, so a reinstall found the previous password and demanded it — for data that went with the uninstall, leaving an owner who had forgotten it locked out of an empty app, advised to reinstall, which is what they had just done. A marker in app storage settles which install the protection belongs to, since an uninstall clears that and not the keychain. The cost, worth stating: clearing app data now clears the lock too, which follows from the threat model this epic assumes — opportunistic access control, not data protection — since anyone who can wipe the data can reinstall anyway.

Removing biometrics asks for it too. Removing a password requires typing it, so removing biometrics must cost as much: an unlocked phone in someone else's hands would otherwise strip the protection in one tap, with nothing asked. A refused prompt leaves both the canary and the switch as they were.

**The canary accepts the device passcode** (`BIOMETRY_ANY_OR_DEVICE_PASSCODE`), superseding the earlier `BIOMETRY_CURRENT_SET` choice. That choice was made when biometrics released a key, where invalidating the item on re-enrolment was the right trade. With no key involved, its only remaining effect would be to shut a biometrics-only user out of their own app with nothing left to try — no password to fall back on and no material to recover. The consequence to accept is that someone who knows the device passcode can open the app; for a user who also set a password, that is a weaker path than the password itself.
