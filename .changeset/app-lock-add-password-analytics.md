---
"live-mobile": minor
"@features/flow-app-lock": minor
---

Track the add-password flow through `@shared/analytics`, per the Password tracking plan.

The protection drawer reports its enable button as `button_clicked` with the variant it offers, and a stored password reports `encryption_activated` with `type: "password"` and the entry point it came from. That `source` is passed by each caller — `settings` from the Settings row, `card` from the Pay tab — and carried through the flow's route params instead of being guessed from where the user happens to be. `password_enabled` and `biometrics_enabled` join every event and the user's traits, read from whichever scheme protects the app, and the traits are refreshed as soon as a password is stored. No payload carries the password or anything derived from it.

The Settings password and biometrics toggles report `toggle_clicked` with `enabled` set to the state the toggle had when it was tapped, on both the revamped and the legacy rows, and the revamped rows now track through `@shared/analytics` too.
