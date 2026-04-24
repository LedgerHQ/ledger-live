---
"@shared/feature-flags": minor
"@shared/schema-primitives": minor
"@domain/entity-currency": minor
"@domain/entity-currency-crypto": minor
"@domain/entity-currency-fiat": minor
"@domain/entity-currency-token": minor
"@domain/entity-currency-unit": minor
---

Wire SonarQube coverage aggregation for `shared/*` and `domain/entity/*` packages (LIVE-29779): add `coverage` scripts and jest-sonar reporter config, tag the packages via the Nx project-tags plugin, and introduce dedicated `test-shared` / `test-domain` reusable workflows that feed coverage into both the PR and scheduled Sonar scans.
