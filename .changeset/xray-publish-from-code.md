---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-desktop-e2e-tests": patch
"ledger-live-mobile-e2e-tests": patch
---

Publish Xray results from code instead of the workflow

Both suites now upload through a shared `XrayClient` rather than hand-rolled curl steps. The
desktop Playwright reporter publishes directly at the end of the run, so the `upload-to-xray` job
disappears entirely. Mobile is sharded, so its results only exist together once every shard's
artifact is downloaded; that aggregation step now also owns the upload, leaving the workflow a
single `node` call instead of four steps of shell.

This removes the duplicated authenticate/import curls, the token-quote handling, the manual key
checks and the inline shell that computed the expected iteration count. Publishing is gated on
`XRAY_ENABLED` plus credentials, so both paths are inert locally and in forks.

The client also drops any test key Xray rejects as not-a-Test and retries, so one mis-tagged test
can no longer sink an entire execution.
