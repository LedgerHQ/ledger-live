---
"live-mobile": patch
"@features/flow-app-lock": minor
"@features/flow-app-unlock": minor
---

Move the app unlock journey into its own flow package, `@features/flow-app-unlock`.

The unlock screen (`useUnlockViewModel`, `UnlockView`, the splash and focus rules) and the forgotten password sheet leave `@features/flow-app-lock`, which no longer exports them. They follow the flow layout, `steps/Unlock` with the sheet under `steps/Unlock/components`, and the app's unlock screen imports them from the new package. Second step of splitting the app lock flow into one package per journey. No behaviour changes.
