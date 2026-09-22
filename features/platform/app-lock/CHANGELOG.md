# @features/platform-app-lock

## 0.4.0-next.0

### Minor Changes

- [#22125](https://github.com/LedgerHQ/ledger-live/pull/22125) [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Make biometrics a protection in its own right: password and biometrics become independent, and either one alone is enough to lock the app.

  Biometrics used to require a password. Its Settings row was disabled until one existed and reset itself whenever the password went away, and the legacy lock returned early without a password, so a biometrics-only user was never locked at all. The revamped path now derives the lock from both protections, so enabling biometrics alone locks the app — and Settings offers it with no password set.

  The row is hidden where the device has no biometrics, or has the hardware with nothing enrolled, rather than shown disabled: there is nothing the user could do about it from that screen.

  Biometrics is asked for **before** the unlock screen draws a field, so it is the first thing the user meets and the password is the fallback. While the prompt is up the screen stands in for the splash, with the mark at the splash's own size so the handover moves nothing. Only a refusal reveals the password field — and a user protected by biometrics alone never sees it: pressing the screen asks again, which is their only way in.

  The prompt is an explicit owner check through `BiometricPrompt` / `LAContext`, not a side effect of reading a protected keychain item. A biometry-gated read can resolve without the OS ever showing anything, and Android reports a correct device PIN as a success the keystore item cannot consume — either way the caller is told the user proved something they were never asked for. On Android 11 and above the OS draws its own "use PIN" button in place of the negative one, and every label it shows comes from the app rather than the library's English defaults.

  The keychain item is therefore a plain marker, not an authentication step: it records that biometrics is on, which the protection state cannot do on its own, being held in memory only. Enabling proves before it records, and a refusal stores nothing.

  The device credential is accepted, because biometrics can now be the only protection: a lockout after failed attempts would otherwise leave the owner with nothing to try. The consequence to accept is that someone who knows the device passcode can open the app — for a user who also set a password, the weaker path.

  Protection that outlived its install is destroyed at boot. iOS keeps keychain items when an app is deleted while Android wipes them, so a reinstall found the previous password and demanded it — for data that went with the uninstall, leaving an owner who had forgotten it locked out of an empty app, advised to reinstall, which is what they had just done. A marker in app storage settles which install the protection belongs to, since an uninstall clears that and not the keychain. The cost, worth stating: clearing app data now clears the lock too, which follows from the threat model this epic assumes — opportunistic access control, not data protection — since anyone who can wipe the data can reinstall anyway.

  Removing biometrics asks for it too. Removing a password requires typing it, so removing biometrics must cost as much: an unlocked phone in someone else's hands would otherwise strip the protection in one tap, with nothing asked. A refused prompt leaves both the canary and the switch as they were.

  **The canary accepts the device passcode** (`BIOMETRY_ANY_OR_DEVICE_PASSCODE`), superseding the earlier `BIOMETRY_CURRENT_SET` choice. That choice was made when biometrics released a key, where invalidating the item on re-enrolment was the right trade. With no key involved, its only remaining effect would be to shut a biometrics-only user out of their own app with nothing left to try — no password to fall back on and no material to recover. The consequence to accept is that someone who knows the device passcode can open the app; for a user who also set a password, that is a weaker path than the password itself.

- [#22045](https://github.com/LedgerHQ/ledger-live/pull/22045) [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Hold the app behind the lock on boot and when it comes back from the background, behind `lwmPasswordRevamp`.

  `AppLockGate` sits above the app, decides once on boot whether protection is configured, and locks again whenever the app is backgrounded. The unlock screen renders over the app rather than replacing it, so nothing below unmounts and the user lands where they left off.

  Two details carry more weight than they look:

  The protection state is read back from the keychain at startup — until now it only lived in memory, so a relaunch reported no password at all. The Settings row renders nothing until that read answers, rather than showing "off" and correcting itself a moment later. A read that fails counts as protected: the app would otherwise open itself on a keychain error.

  Backgrounding is judged per platform. On iOS only `background` locks, because the biometric prompt itself pushes the app to `inactive` — locking there would mean the prompt locks the app it was about to open.

  Which path the app takes is decided by the stored state, not only by the flag: a user who already holds a verifier keeps the revamped screens even if `lwmPasswordRevamp` is rolled back, since the legacy ones cannot remove it and ignoring it would silently drop their protection. That resolved scheme now governs the add and modify navigators too, which read the raw flag until now — on a rollback they sent a verifier holder to the legacy removal screen, which clears the legacy keychain entry and leaves the verifier in place, so the lock could not be turned off.

  Removing the last protection also releases the lock. A removal takes a slow derivation, and backgrounding during it locks the app; the removal then destroyed the verifier while the lock stood, leaving an unlock screen with nothing left to open it.

  While that read is in flight the app is covered rather than shown: the state starts unlocked, so rendering it would hand the app to whoever holds the phone for as long as the keychain takes. Once locked, the app below stays mounted — unlocking returns the user where they were — but leaves the accessibility tree, or a screen reader would walk into it.

- [#22098](https://github.com/LedgerHQ/ledger-live/pull/22098) [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Move existing passwords off the plaintext scheme onto a verifier, without asking the user anything.

  Every user with a password today is on a scheme that stores it in plaintext and verifies it by string comparison — not only the short ones. The migration derives a digest from the password they already have, so it needs the plaintext: it runs right after a successful **legacy** unlock, the one moment the password has been proven and is in hand, and not at boot.

  Write, prove, only then delete. A crash between the write and the delete leaves the user a way in through the legacy entry; after the delete, through the verifier. Never through neither. That also makes it resumable: a verifier already present means an earlier run got that far, so the next one proves it and finishes rather than deriving a second time. A stored verifier the proven password will not open is derived over, since it can only be a half-written record or one this migration never put there, and the plaintext in hand at that moment restores a credential that works. Only a keychain that will not hold the record defers, leaving the legacy entry as the way in — as does one that declines to delete the legacy entry, since the plaintext is still there and needs the lock that stands over it.

  A run that died between the delete and retiring the legacy lock is repaired on the next boot: the entry gone with a verifier in its place can only mean the sequence reached its last step, so that verifier is what opens the app and the legacy flag is released. Without that the legacy screen asked for a password nothing could check.

  A completed migration retires the legacy lock, clearing `privacy.hasPassword`. Without it the app carries two independent guards: the old `AuthPass` screen renders over the new unlock screen, and the revamped Settings row hides the legacy toggle that could remove the old credential.

  Whether the password is under the six-character minimum is recorded as it migrates, because nothing can tell afterwards — a verifier says nothing about the length of the password behind it. The prompt that acts on it is LIVE-35981.

  The derivation queue is held for exactly one turn across the whole sequence. This shipped broken once: the migration took a turn and then called a password check that asked for another, so the inner call waited on the outer, the outer on the inner, and every later check waited on both — the app could not be unlocked at all. The check is now the unserialised primitive the public checks are built on, and a test fails if anything asks for a second turn.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

## 0.3.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

## 0.3.0-next.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

## 0.2.0

### Minor Changes

- [#20847](https://github.com/LedgerHQ/ledger-live/pull/20847) [`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two app lock packages the User App Authentication tickets build on: `@shared/password-verifier` (the verifier record and its constant-time comparison) and `@features/platform-app-lock` (protection state schemas, biometrics status unions and errors).

  No functional change to Ledger Wallet Mobile: `react-native-keychain` now resolves through the pnpm catalog instead of a direct pin, so the app and `@features/platform-app-lock` cannot drift apart. It still resolves to 10.0.0.

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

## 0.2.0-next.0

### Minor Changes

- [#20847](https://github.com/LedgerHQ/ledger-live/pull/20847) [`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two app lock packages the User App Authentication tickets build on: `@shared/password-verifier` (the verifier record and its constant-time comparison) and `@features/platform-app-lock` (protection state schemas, biometrics status unions and errors).

  No functional change to Ledger Wallet Mobile: `react-native-keychain` now resolves through the pnpm catalog instead of a direct pin, so the app and `@features/platform-app-lock` cannot drift apart. It still resolves to 10.0.0.

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.
