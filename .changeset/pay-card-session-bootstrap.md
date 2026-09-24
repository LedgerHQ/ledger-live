---
"ledger-live-desktop": minor
---

Start the app with an injected Card session for local development and E2E. Desktop cannot finish the Card OAuth login yet — the hosted page opens in the user's own browser and reports nothing back (LIVE-34740) — and the session token lives in renderer memory rather than the persisted redux state, so a `userdata` fixture cannot carry it either.

`CARD_SESSION_BOOTSTRAP` takes a `PayCardSession` as JSON, read from `process.env` at boot to seed the Card session and mark the app signed in. Keeping it out of `@shared/env` keeps the bearer token out of `getAllEnvs()`. After the read, the process env is cleared; a later launch still receives the value if the parent environment still has it.

It is honoured in a development build or in any build launched with `PLAYWRIGHT_RUN` — a packaged build included. The gate is a runtime check rather than a build-time constant so that release-mode E2E, which tests the release bundle, can still inject a session; the cost is that setting the variable on a shipped app does work, so it assumes control of that app's launch environment.
