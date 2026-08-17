---
"@features/flow-pay-card-deposit": minor
---

Add the shared Pay Card Deposit options component and view-model to `@features/flow-pay-card-deposit`: a Lumen dialog on desktop and a bottom sheet on mobile listing the four deposit options (bank transfer, swap, receive, buy), emitting host-owned navigation intents via `onSelect` and tracking via the injected `onTrackEvent`.
