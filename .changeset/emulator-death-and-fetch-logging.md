---
"live-mobile": minor
"ledger-live-mobile-e2e-tests": minor
---

Record `fetch` traffic in the e2e network log alongside axios, so RTK Query — and therefore
every CAL token lookup — is no longer invisible in CI artifacts, and attach a per-host
summary with peak concurrency so a fan-out is legible without reading several hundred
entries. Query strings, fragments and any `user:pass@` userinfo are stripped before a URL is
recorded, and no bodies or headers are captured.
