---
"@features/flow-pay-card": minor
---

refactor(pay-card): accept a pending login and a host page opener

`CardProps`/`CardViewProps` gain optional `openHostedLogin` and `openHostedPage`, so a host app can supply how the Card flow opens its hosted pages instead of the flow assuming one way to do it.
