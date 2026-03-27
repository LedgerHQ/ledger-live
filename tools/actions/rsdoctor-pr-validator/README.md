# rsdoctor-pr-validator

Composite action under `tools/actions/rsdoctor-pr-validator/` (used on pull requests) to:

1. Download optional **desktop** and **mobile** Rsdoctor artifacts (from prior workflow jobs).
2. Merge them under repo-root `rsdoctor/` (same layout as local `RSDOCTOR=1` builds).
3. Run [`web-infra-dev/rsdoctor-action`](https://github.com/web-infra-dev/rsdoctor-action) (pinned ref) **once** for PR comments / diffs.

**Usage:** `uses: ./tools/actions/rsdoctor-pr-validator`

`target_branch` is forwarded to `rsdoctor-action` (PR base ref); desktop/mobile **PR build jobs** are expected to produce the Rsdoctor JSON that this composite downloads and merges before running the action.

## Workflow expectations

- Pass **empty** `desktop_artifact_name` or `mobile_artifact_name` to skip that download.
- Desktop artifact is **required** when its input is non-empty; the job fails if the artifact is missing or has no `desktop-*/rsdoctor-data.json`.
- Mobile download uses `continue-on-error` so missing mobile data (e.g. iOS JS build skipped on cache hit) does not fail the job.

## Extending: GitHub Check Runs (X of V)

To post custom check runs from this action, grant `permissions.checks: write` on the **workflow** (or job) and add steps or a small Node helper in this folder if needed. A no-op reminder step is included at the end of the composite.
