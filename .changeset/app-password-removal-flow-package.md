---
"live-mobile": patch
"@features/flow-app-password-removal": minor
---

Move the password removal journey — the Deactivate password step and the sheet that keeps the last protection while a card is active — out of `@features/flow-app-lock` into a new `@features/flow-app-password-removal` package. The Settings password and biometrics rows and the Deactivate password screen import it from there. No behaviour change.
