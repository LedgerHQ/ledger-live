---
"@features/platform-app-lock": minor
"@features/flow-app-unlock": minor
"@features/flow-app-password-setup": minor
"@features/flow-app-password-removal": minor
"live-mobile": minor
---

`PasswordField`, `PasswordFieldProps`, `PasswordDraftProvider`, `usePasswordDraft` and `PasswordDraft` move to the native entry `@features/platform-app-lock/native`, and `@features/platform-app-lock` no longer exports them. The package imports carry no platform suffix and it typechecks a web and a native project.
