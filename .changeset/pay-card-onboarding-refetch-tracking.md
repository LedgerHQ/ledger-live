---
"@features/flow-pay-card-widget": patch
"@features/flow-pay-card": patch
"@devtools/bindings": patch
---

fix(pay-card): keep lifecycle tracking waiting on onboarding refetches

`useCardOnboardingStatus` now reports `isFetching` next to `isLoading`, which covers the first
read only. The lifecycle tracking and the Pay Card devtool read it, so a milestone is no longer
derived from onboarding signals that a refetch is about to replace.
