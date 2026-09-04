---
"@features/flow-pay-balance": minor
"@features/flow-pay-deposit": minor
"@features/flow-pay-feature-tour": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@devtools/bindings": minor
---

Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.
