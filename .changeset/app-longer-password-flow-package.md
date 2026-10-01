---
"live-mobile": patch
"@features/flow-app-lock": minor
"@features/flow-app-longer-password": minor
---

Move the mandatory longer-password journey out of `@features/flow-app-lock` into a new `@features/flow-app-longer-password` package: `useLongerPasswordViewModel`, `LongerPasswordView` and its enter and confirm steps, `ChangePasswordSheet` and `PasswordChangedSheet`. The app's longer-password gate imports them from there, and the enter and confirm steps still reuse `@features/flow-app-password-setup`, which `@features/flow-app-lock` no longer depends on. No behaviour change.
