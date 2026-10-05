---
"live-mobile": patch
"@features/flow-app-protection-prompt": minor
---

Move the app protection prompt — `useProtectionPromptViewModel`, `EnableProtectionSheet` and `ProtectionEnabledSheet` — into a new `@features/flow-app-protection-prompt` package, and delete `@features/flow-app-lock`, now empty. The app's protection prompt imports from the new package. Last step of splitting the app lock flow into one package per journey. No behaviour change.
