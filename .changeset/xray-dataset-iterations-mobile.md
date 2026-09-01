---
"@ledgerhq/live-e2e-shared": patch
"ledger-live-mobile-e2e-tests": patch
"ledger-live-desktop-e2e-tests": patch
---

Report mobile add account coins as Xray dataset iterations

Brings LWM to parity with LWD: the 18 `addAccount*.spec.ts` files drop their per-coin TMS links
and instead report as `Currency` iterations of a single Xray test, via the `$Parameter` global the
allure reporter already injects. The Xray test key is declared per platform, so each suite owns
its own.

`xray.formater.sh` is replaced by `scripts/publish-xray-report.mjs`, which reuses the same payload
builder as desktop instead of reimplementing it in bash. That fixes several defects in the old
script: allure statuses are mapped to valid Xray ones (`skipped`/`unknown` were sent verbatim),
only `tms`-type links are treated as test keys, results are ordered by start time so a passing
retry reliably wins, and the failure message is attached to the failing row.

Also fixes three bugs in the mobile upload job. The matrix exclusion read `github.event.inputs`,
which is the caller's event under `workflow_call`, so the Android leg still ran for "iOS Only" and
posted an empty result set. `TEST_EXECUTION` fell through to the iOS key whenever the Android key
was empty, publishing Android results into the iOS execution. And the curl steps had no error
handling, so a rejected import exited 0 with the execution silently lost.

Because Xray replaces a Test Run's iterations rather than merging them, the upload is now skipped
for filtered and smoke runs, and the payload builder refuses to publish when rows are missing.
