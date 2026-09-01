---
"ledger-live-desktop": patch
"@shared/env": patch
---

Start the app with an injected Card session for local development and E2E. Desktop cannot finish the Card OAuth login yet — the hosted page opens in the user's own browser and reports nothing back (LIVE-34740) — and the session token lives in renderer memory rather than the persisted redux state, so a `userdata` fixture cannot carry it either.

`CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON, read at boot to seed the Card session and mark the app signed in. It injects a bearer credential, and is read in a development build or in any build launched with `PLAYWRIGHT_RUN`, which the Playwright fixture sets — a packaged build included. The gate is a runtime check rather than a build-time constant so that release-mode E2E, which tests the release bundle, can still inject a session; the cost is that setting the variable on a shipped app does work, so it assumes control of that app's launch environment.
