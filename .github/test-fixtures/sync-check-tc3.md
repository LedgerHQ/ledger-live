# TC3: Sync check fixture — unintentional drift

This branch is intentionally behind `develop` on workflow files.
It exists purely as a test fixture for the sync-check e2e test (TC3).
The PR associated with this branch does NOT touch any `.github/workflows/` files.

Expected check result: `can_proceed=false` (workflow files drifted unintentionally)
