---
"live-mobile": minor
"@features/flow-app-lock": minor
"@features/platform-app-lock": minor
---

Stop a card holder from leaving the app with nothing protecting it.

Both protection rows in Settings let anyone turn protection off, so someone holding a card could strip the app of its last lock. Without a card that stays allowed — the app lock is opt-in — but a card turns "at least one protection" into a rule.

Removing the last one is now refused, and a sheet says why at the moment the user asks, rather than a disabled row that explains nothing. Removing one of two is still allowed: at least one protection is the invariant, and which one is the user's choice — so a password can still be swapped for biometrics, or the reverse.

What counts as holding a card is the **card session stored on the device**, which `@features/platform-card` owns — not Pay's feature flag, and not whether the Pay tab has been opened. A holder who has not been near Pay on this launch is still a holder, and turning Pay's flag off does not turn the rule off. The session is read when the user asks to remove a protection, not when Settings opens, so a tap can never land before the answer, and a session that started or ended with Settings open is seen. A session that cannot be read counts as a card: a refusal can be retried, while a removal cannot be taken back.

The rule applies to the revamped rows. The legacy rows shown while `lwmPasswordRevamp` is off are left as they are.
