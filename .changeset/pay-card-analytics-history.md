---
"@features/flow-pay-card": patch
"@features/flow-pay-card-widget": patch
"@features/flow-pay-card-transactions": patch
"@features/flow-pay-feature-tour": patch
"@features/flow-pay-card-auth": patch
"@features/flow-pay-bank-transfer": patch
"@features/flow-pay-balance": patch
"@features/flow-pay-deposit": patch
"@features/flow-pay-request": patch
"@features/platform-pay-analytics": patch
"ledger-live-desktop": patch
"live-mobile": patch
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
