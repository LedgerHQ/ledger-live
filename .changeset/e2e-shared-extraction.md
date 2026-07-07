---
"@ledgerhq/live-e2e-shared": minor
"@ledgerhq/live-common": minor
"@shared/feature-flags": minor
"ledger-live-desktop": minor
"live-mobile": minor
"ledger-live-desktop-e2e-tests": minor
"ledger-live-mobile-e2e-tests": minor
---

Extract E2E test-support code out of `@ledgerhq/live-common`

Moved the E2E enums, models, family helpers and speculos/device utilities that lived under
`@ledgerhq/live-common/e2e/*` into a new dedicated, private package `@ledgerhq/live-e2e-shared`
(located under `e2e/`, alongside the Desktop and Mobile E2E suites). This keeps test-only code
out of `live-common`, which is in maintenance mode.

- `@ledgerhq/live-common`: removed the internal `./e2e` export.
- `@shared/feature-flags`: now exports `getAllFeatureFlags` (previously in the live-common e2e
  module), so production debug tooling no longer depends on test code.
- `ledger-live-desktop`: the `devices` reducer now derives the Speculos device model from a small
  local map instead of importing from the e2e module.
- Desktop/Mobile apps and E2E suites now import from `@ledgerhq/live-e2e-shared`.
