---
"live-mobile": patch
"@features/platform-app-lock": minor
---

Move the app lock UI shared by several journeys into `@features/platform-app-lock`.

`PasswordField` and the password draft (`PasswordDraftProvider`, `usePasswordDraft`) leave `@features/flow-app-lock`, which no longer exports them, for `@features/platform-app-lock`, exported from its native entry only. This is the first step of splitting the app lock flow into one package per journey: unlock, password setup and removal, longer password and the protection prompt each need these pieces, and none of them should depend on another journey to get them. No behaviour changes.
