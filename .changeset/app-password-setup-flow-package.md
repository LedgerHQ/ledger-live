---
"live-mobile": patch
"@features/flow-app-lock": minor
"@features/flow-app-password-setup": minor
---

Move the app password setup steps into their own flow package, `@features/flow-app-password-setup`.

The Setup password and Confirm password steps (`useSetupPasswordViewModel`, `SetupPasswordView`, `useConfirmPasswordViewModel`, `ConfirmPasswordView`) leave `@features/flow-app-lock`, which no longer exports them, for `steps/SetupPassword` and `steps/ConfirmPassword` in the new package. The app's add-password screens import them from there, and the longer-password journey, still in `@features/flow-app-lock`, reuses them through the new package. Third step of splitting the app lock flow into one package per journey. No behaviour changes.
