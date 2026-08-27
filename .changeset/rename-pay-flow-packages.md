---
"@features/flow-pay-balance": patch
"@features/flow-pay-deposit": patch
"@features/flow-pay-feature-tour": patch
"ledger-live-desktop": patch
"live-mobile": patch
"@devtools/bindings": patch
---

Rename the Pay flow packages to drop the redundant `card` segment: `@features/flow-pay-card-balance` → `@features/flow-pay-balance`, `@features/flow-pay-card-deposit` → `@features/flow-pay-deposit`, and `@features/flow-pay-card-feature-tour` → `@features/flow-pay-feature-tour`. Package paths, npm names and all imports are updated; persisted Redux state keys and component test IDs are unchanged.
