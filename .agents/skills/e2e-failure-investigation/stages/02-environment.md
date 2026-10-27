# 02 Environment

Input: `logs/`, `config/environments.json`. Output: `environment.json`.

1. Run `node scripts/detect-environment.mjs $STATE_DIR/runs/<run_id>`.
2. Read `environment.json`. The `environment` field is `testing` (Swap STG) or `production` (Swap PRD). The detected value is the baseline for all later checks, Datadog included.
3. If `mismatch` is true, or the log value is not in the config, use the log value and note it in `report.md`.
4. Read `known_env_mismatches`. If a failing test depends on one of them, report it as its own finding.
