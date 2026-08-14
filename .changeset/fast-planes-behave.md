---
"@features/flow-pay-card-feature-tour": minor
"@features/flow-pay-card-balance": minor
"@features/flow-pay-card-auth": minor
"@domain/api-card-management": minor
"ledger-live-desktop": minor
"live-mobile": minor
"@devtools/bindings": minor
---

Move the Pay Card UI Redux state out of the removed `@domain/entity-pay-card` package into the owning feature flows: the balance filter goes to `@features/flow-pay-card-balance` and the feature-tour seen flag to `@features/flow-pay-card-feature-tour`. The apps keep persisting it under the existing `payCard` key (no data migration). Both flows expose a UI-free `./state` entry so store, persistence and test setup can use the slice without pulling in the flow UI.
