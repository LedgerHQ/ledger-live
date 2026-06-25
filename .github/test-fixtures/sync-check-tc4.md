# TC4: Sync check fixture — mixed drift (intentional + unintentional)

This branch is intentionally behind `develop` on workflow files.
It also contains a deliberate change to `test-mobile-e2e-reusable.yml`.

Drift from develop: sonar.yml (unintentional), test-mobile-e2e-reusable.yml (intentional)
PR files in .github/workflows/: test-mobile-e2e-reusable.yml only

Expected check result:
  - can_proceed=false (sonar.yml is unintentional drift)
  - test-mobile-e2e-reusable.yml excluded from failure (intentionally authored)
  - unintentional_files=.github/workflows/sonar.yml
