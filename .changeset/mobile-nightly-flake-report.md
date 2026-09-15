---
"ledger-live-mobile-e2e-tests": patch
---

Add `e2e/mobile/scripts/flake-report.mjs`, which ranks flaky mobile E2E tests from the nightly
CI history so a ticket can name a root cause rather than a symptom. It reads the Allure
`*-result.json` files out of the `{android,ios}-test-artifacts-*` artifacts of the last N
scheduled runs — the same source `get-failed-tests-summary` uses, and the only one that records
retries, since CI runs Detox with `--retries 2` and the Jest `--outputFile` JSON keeps just the
failing attempt.

A test counts as flaky only when a single run holds both a failing and a passing attempt of it.
Detox retries the whole spec file, so the passing siblings of one failing test also show three
attempts: treating "has retries" as flaky reports every test in the spec, which on the 2026-08-25
nightly would have been 14 false positives from `swapDeeplinks.spec.ts` alone. Tests that failed
every attempt are reported separately as consistently failing, not as flakes.

Failures are then grouped by signature — failure kind plus the first non-wrapper repo frame from
the stack — so two specs timing out inside the same page object are one entry instead of two, and
each group carries its flake rate, affected platforms, run links and a ready `flake-check.sh`
command to reproduce it locally.

The latest nightly is treated as the primary signal, since it is the only run that reflects
`develop` as it stands now: every signature is tagged as still firing in it or not, ranking puts
the ones that are first, and each of the others carries a `git log --merges --since=<last seen>`
command over the files it implicates — because a fix merged in between makes a high historical
rate describe code that no longer exists. Absence from one nightly is not itself treated as a
fix; a flake passes on some nights by definition.
