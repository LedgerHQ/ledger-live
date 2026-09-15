---
"@features/flow-pay-card": minor
"@features/flow-pay-card-auth": minor
---

refactor(pay-card): accept a pending login and a host page opener

`CardProps`/`CardViewProps` now take one nested `login: CardLoginProps` instead of the loose `oauthConfig`, `callback` and `onTrackEvent` props. `CardLoginProps` carries those three and adds optional `openHostedLogin` and `openHostedPage`, so a host app can supply how the Card flow opens its hosted pages instead of the flow assuming one way to do it.

The flow also ignores a stray login redirect from an abandoned attempt. A redirect from an attempt the user had already retried away from could still land after a fresh attempt started, get exchanged against the new attempt's verifier, fail, and wipe that new attempt. The authorize URL now carries a local attempt id that the app compares against the current attempt before acting on a redirect.
