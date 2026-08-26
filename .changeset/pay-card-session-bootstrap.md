---
"ledger-live-desktop": patch
"@shared/env": patch
---

Start the app with an injected Card session for local development and E2E. Desktop cannot finish the Card OAuth login yet — the hosted page opens in the user's own browser and reports nothing back (LIVE-34740) — and the session token lives in renderer memory rather than the persisted redux state, so a `userdata` fixture cannot carry it either.

`CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON, read at boot to seed the Card session and mark the app signed in. It injects a bearer credential, so it is honoured only in a development build or under `PLAYWRIGHT_RUN`; a packaged build ignores it even when the variable is set.
