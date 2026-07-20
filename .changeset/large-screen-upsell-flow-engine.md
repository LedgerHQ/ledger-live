---
"@features/flow-large-screen-upsell": minor
---

Create `@features/flow-large-screen-upsell`, the audience/cooldown eligibility and frequency-throttle decision for the large-screen upsell modal. Exports `getLargeScreenUpsellDecision`, a pure function taking `userState` and `context` arguments, and `useLargeScreenUpsellDecision`, a hook wiring the `largeScreenUpsell` feature flag and the `@domain/entity-large-screen-upsell-modal` selectors into it. Stacked on the domain-entity package (#19617); UI, persistence, and analytics land in follow-up PRs.
