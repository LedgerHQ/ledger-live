---
"@shared/api-services": minor
"@domain/api-card-management": minor
"@features/platform-card": minor
"@features/flow-pay-card-auth": minor
"ledger-live-desktop": patch
"live-mobile": patch
---

Refresh Baanx Pay Card sessions after a 401, and keep the credentials out of every reader of redux.

The two OAuth2 grants are RTK Query endpoints again. Both opt out of the Bearer and out of the
renewal, both run with `track: false`, so no session becomes a cache entry, and neither has a hook.

The desktop redux logger and both DevTools configurations now strip every Card action, which also
closes a live leak: the code exchange logs its code and its code verifier in production, into the
file users attach to a support ticket.
