---
"@features/flow-pay-card": minor
"@features/flow-pay-card-widget": minor
"@features/flow-pay-card-transactions": minor
"@features/flow-pay-feature-tour": minor
"@features/flow-pay-card-auth": minor
"@features/flow-pay-bank-transfer": minor
"@features/flow-pay-balance": minor
"@features/flow-pay-deposit": minor
"@features/flow-pay-request": minor
"@features/platform-pay-analytics": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

Fix Pay analytics events that never reached Segment, and align the feature-intro page names.

Pay tracking no longer travels through a React context: `@features/platform-pay-analytics` exposes
module-level trackers built on `@shared/analytics`, and every Pay flow imports the one it needs.
The provider could not be reached from inside `@gorhom/bottom-sheet` portals on mobile, so the card
details sheet and the reward-currencies CTA silently dropped their events. The `onTrackEvent` prop
is gone from every Pay flow package and from both host apps.

Card milestone events are now planned from a first-read baseline, so they no longer replay on each
login. Feature-intro pages report as `Page Feature Intro <flow>`, and the bank transfer flow is
named `Cash to stable` instead of `C2S`.
