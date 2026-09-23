---
"@features/platform-app-lock": minor
"@features/flow-app-lock": minor
"live-mobile": minor
---

Require a password of at least six characters from users who set a shorter one, the next time they get in.

Any length was accepted before this epic — `"1"` among them — so the minimum the new screens enforce would otherwise apply to new passwords only. The prompt cannot be dismissed: there is no close button, the backdrop does not take a press, and the Android back button is swallowed while it holds the screen. A prompt that can be put off is one that short passwords outlive.

It runs after a successful unlock, not at boot, because that is when the password has been proven and its length is known. Four steps: a sheet that says why, the new password, its confirmation, and a sheet that says it worked. The old password is never asked for again — they just typed it to get in.

**The requirement is stored, beside the verifier it describes.** The protection state is deliberately not persisted, since a second source of truth about whether a password exists is a lockout risk, and this mark cannot be recomputed from a digest: a verifier says nothing about the length of the password behind it. So it rides in the same keychain record, written and cleared by the single write that sets the password it describes, and the two cannot disagree.

It is also **re-derived at every password unlock**, which is what heals a record written before the mark existed, and what corrects one whose password was changed elsewhere. The stored mark still earns its place: a biometric unlock never sees a password, and the prompt is owed on that boot too.

A write the keychain declines is reported as a failure rather than as a password change, so the confirmation holds instead of sending the user off with a verifier that is still the old one. The mark's own repair at unlock is best-effort by contrast: metadata must never cost somebody an unlock they have just earned.

An overlay rather than a route: a route is presented over the app in its own window, and the sheets — which present into the app's window — would be visible through it while taking none of the taps aimed at them.
