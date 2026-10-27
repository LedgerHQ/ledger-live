# 02 Environment

Input: `logs/`, `config/environments.json`, `preflight.json`. Output: `environment.json`, updated `preflight.json`.

1. Run `node scripts/detect-environment.mjs $STATE_DIR/runs/<run_id>`.
2. Copy `environment`, `sources`, and detection status into `preflight.json.environment`. `testing` is Swap STG and `production` is Swap PRD.
3. If `mismatch` is true, or a log value is absent from config, use the observed log value and add the mismatch to report gaps.
4. Read `known_env_mismatches`. Report a separate finding only when a failed test depends on one.
