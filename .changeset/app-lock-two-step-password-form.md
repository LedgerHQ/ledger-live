---
"@features/platform-app-lock": minor
"@features/flow-app-lock": minor
"live-mobile": minor
---

Add the two-step form for setting an app lock password, behind `lwmPasswordRevamp`. The legacy screens stay on the flag-off path untouched.

`@features/flow-app-lock` gains one shared password field that every password surface will use, the two entry steps as ViewModel and View, and a draft that carries the chosen password from the first step to the second in memory — not through navigation state, which is serialisable and gets persisted. `@features/platform-app-lock` gains the minimum-length rule, which the migration off short passwords will need as well.

Nothing is stored yet: confirming closes the flow and leaves the Settings switch off until the verifier lands.
