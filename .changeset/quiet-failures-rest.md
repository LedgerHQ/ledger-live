---
"ledger-live-mobile-e2e-tests": patch
---

Add `$KnownFailure` to flag mobile E2E tests failing on a tracked bug: they still run once and report failed, but Detox no longer retries them.
