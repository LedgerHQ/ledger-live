# @features/flow-app-lock

## 0.5.0-next.1

### Patch Changes

- Updated dependencies [[`48af604`](https://github.com/LedgerHQ/ledger-live/commit/48af6040c2835f067a2dfe38fb8fadde72e0787b)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.1
  - @shared/ui-info-state@0.3.0-next.1

## 0.5.0-next.0

### Minor Changes

- [#22211](https://github.com/LedgerHQ/ledger-live/pull/22211) [`d137f01`](https://github.com/LedgerHQ/ledger-live/commit/d137f01ed03877ca783d8b97eb303bde6e3ff998) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Offer biometrics on the unlock screen with the symbol the device actually uses.

  The field asked for biometrics with a generic touch symbol, because Lumen had no biometric one when the screen was built. It has since gained `FaceId` and `Fingerprint`, so a face device now shows a face and a fingerprint device a fingerprint.

  The device reports six kinds and there are two symbols: a touch is a fingertip on either platform, and everything the device reads from the face — iris and Optic ID included — takes the face symbol, since there is no iris symbol and an eye read is nearer a face than a fingertip. The capability is read asynchronously while the affordance comes from stored state, so the generic touch symbol still stands in for the moment before the device has answered, and for a read that fails.

- [#22275](https://github.com/LedgerHQ/ledger-live/pull/22275) [`35a5198`](https://github.com/LedgerHQ/ledger-live/commit/35a51980fc4d32efd7fd8440e5f5e9ef6a7348db) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Give a user protected by biometrics alone a way back when their face goes unread.

  The unlock screen already retried the prompt when tapped, but nothing said so: with no password set, a face the camera never saw left the Ledger mark on black and no visible way forward. The whole screen being the button is no help to someone who cannot tell there is a button.

  A real call to action now sits under the mark — "Unlock Ledger Wallet" — and it appears only once the prompt has gone. While the prompt is up the system dialog owns the screen, and at boot the bare mark is what keeps the handover from the launch screen invisible.

  The other half is the OS's and already works: while its dialog is up, the device credential the app asks for makes iOS draw "Try Face ID Again" and "Enter Passcode" itself. It is only after that dialog is cancelled, when nothing will reopen it, that the app has to offer the way back.

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

- [#22163](https://github.com/LedgerHQ/ledger-live/pull/22163) [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Tell a user who has forgotten their app-lock password what their options are, from the unlock screen.

  The link was already on the unlock screen and the flow package already accepted the callback, but nothing in the app provided it — so the link never rendered and there was no answer to give.

  There is no recovery to offer, and that is the point of the scheme: the password is not stored, only a verifier derived from it, so nothing can reverse it. The sheet says so and names the one way back — reinstalling the app, which drops the lock along with the app's data. That advice is only true now that protection outliving its install is destroyed at boot; before, on iOS the keychain survived an uninstall and the reinstall demanded the very password the user had forgotten.

  The sheet is absent for a user protected by biometrics alone, who has no password to forget.

  The sheet lives in the flow package with the screen that raises it, which needed `@shared/ui-info-state` to offer `./native` and `./web` entries beside its conditional root: a `features/flow` package can only reach the root through the `react-native` condition, and that condition resolves Lumen to source and demands its whole native peer graph. Existing consumers keep importing the root, and keep the conditions they had.

- [#22179](https://github.com/LedgerHQ/ledger-live/pull/22179) [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let any part of the app ask for the app to be protected before it continues, and answer for it.

  A feature that needs protection — the Card, first — now awaits one call: `requestProtection()`. The prompt decides what to ask for, so no caller looks at biometry: biometrics if the device has some enrolled, a password otherwise. An already-protected user is never interrupted and their action simply runs.

  The password path opens the existing add-password flow and comes back with a confirmation sheet, so the caller resumes where it left off. Dismissing the prompt, or backing out of the password flow, holds the caller's action instead — a request never resolves as protected unless protection is actually in place.

  Both sheets are mounted once, above the screens, so navigating away no longer closes the prompt the way a screen-owned sheet would.

  The card is the first caller: both ways out of its login lead to the provider, so signing up and logging in each wait for protection. The card flow takes the request as a prop, since a flow package cannot reach the app's prompt, and only the native entry passes one — desktop has no app lock and is unchanged.

- [#21984](https://github.com/LedgerHQ/ledger-live/pull/21984) [`675564f`](https://github.com/LedgerHQ/ledger-live/commit/675564fc759b896ffcc26c99fc4d9d0a0a3bd344) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the unlock screen and route every password check through one place.

  `checkPassword` becomes the only function that verifies a password, used by both unlock and deactivation, so neither can drift into comparing against something stored. It derives with the parameters carried by the verifier rather than the current defaults, which is what lets a password set before a cost change still be proven.

  The screen itself follows Figma: black full-bleed with the Ledger mark near the top, the shared password field under it, and the CTA labelled Confirm. It is forced to the dark palette rather than following the user's theme — the splash is black and this screen takes over from it with the mark in the same place, so a light rendering would flash on handover. It also carries no minimum-length rule, since the password may predate the six-character one.

  Nothing mounts it yet: the orchestration, the biometric path and the forgot-password sheet are the gate.

### Patch Changes

- Updated dependencies [[`871e485`](https://github.com/LedgerHQ/ledger-live/commit/871e4854284a0b21e31b53ff0ac312010093d914), [`795e693`](https://github.com/LedgerHQ/ledger-live/commit/795e693bd67a942bc3c272183476ef470d3c8605), [`944bd23`](https://github.com/LedgerHQ/ledger-live/commit/944bd2345899c399bc931144fe46b48d0d1bf55b), [`1badf50`](https://github.com/LedgerHQ/ledger-live/commit/1badf50ec0c225f93b46ed5b1368257cc9b8e88d), [`8d1a795`](https://github.com/LedgerHQ/ledger-live/commit/8d1a79550afabc570b2d3b7867432d5a9f1d4e87), [`a1a8b81`](https://github.com/LedgerHQ/ledger-live/commit/a1a8b81b3f9b4eb897ac3d81427a1df0a5e0130b), [`c52af21`](https://github.com/LedgerHQ/ledger-live/commit/c52af21b622efa62774657e190abb9762cffac1c), [`bc43337`](https://github.com/LedgerHQ/ledger-live/commit/bc433372ebed1990d81a87b109eeb4d928271315)]:
  - @shared/ui-queued-bottom-sheet@0.5.0-next.0
  - @features/platform-app-lock@0.4.0-next.0
  - @shared/ui-info-state@0.3.0-next.0

## 0.4.0

### Minor Changes

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0

## 0.4.0-next.0

### Minor Changes

- [#21961](https://github.com/LedgerHQ/ledger-live/pull/21961) [`2b976be`](https://github.com/LedgerHQ/ledger-live/commit/2b976be3c7d61accd0911b439263be9d66f50508) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Let someone remove their app lock password, behind `lwmPasswordRevamp`.

  Turning the switch off used to reach the legacy removal screen, which reads the default keychain item and compares plaintext. A revamped password lives under its own service as a verifier, so that screen could never succeed — and its `if (credentials)` guard skipped the comparison entirely when it found nothing, clearing legacy state without ever checking the password.

  The new screen derives with the parameters stored in the verifier rather than today's defaults, compares in constant time, and destroys the verifier before flipping the protection state. A wrong password and a keychain that will not answer are reported differently, since a single boolean forced one to be shown as the other.

  The screens also stop taking their strings as a `labels` object built by the app: each one now calls `useTranslation` from `@shared/i18n` where it renders, as the `pay-*` flows already do. That removes the `*Labels` types and the per-screen `useMemo` that rebuilt them, and turns the failure props into booleans so the state stays in the view model while the message lives in the view.

### Patch Changes

- Updated dependencies []:
  - @shared/i18n@0.2.0

## 0.3.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

### Patch Changes

- Updated dependencies [[`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897)]:
  - @features/platform-app-lock@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#21026](https://github.com/LedgerHQ/ledger-live/pull/21026) [`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Store a scrypt verifier instead of the password itself. Confirming a password now derives a digest and persists `{version, scrypt, salt, digest}` in the keychain, so nothing that can be replayed as a password is kept anywhere.

  The protection state lands with it: two independent flags plus a session lock, keyed off "any protection is enabled" rather than on having a password, which is the coupling that makes biometrics-only impossible today.

  Ordering is the safety argument throughout — the whole verifier is one keychain item, so an interrupted write leaves the previous verifier or none, never a half-written pairing, and the state flips only once the write has landed. Derivations are serialised: two concurrent setups would otherwise interleave and store a verifier whose salt belongs to the other run.

  The password field also gains a length cap. It sits far above anything anyone types, and exists because deriving a digest is deliberately slow.

### Patch Changes

- Updated dependencies [[`4f514c9`](https://github.com/LedgerHQ/ledger-live/commit/4f514c97491277ea63524e299904fe5e5711d897)]:
  - @features/platform-app-lock@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

### Patch Changes

- Updated dependencies [[`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb)]:
  - @features/platform-app-lock@0.2.0

## 0.2.0-next.0

### Minor Changes

- [#20988](https://github.com/LedgerHQ/ledger-live/pull/20988) [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

  `@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

  Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.

### Patch Changes

- Updated dependencies [[`197acad`](https://github.com/LedgerHQ/ledger-live/commit/197acad8c74b6fe833ce8dbf78db472643b00819), [`5bd3557`](https://github.com/LedgerHQ/ledger-live/commit/5bd3557bf160876d9a0a392f0bbe1841083560cb)]:
  - @features/platform-app-lock@0.2.0-next.0
