#!/usr/bin/env bash
# Usage: collect.sh <run_id> <run_dir>
# Writes <run_dir>/jobs.json, logs/<job_id>.log and selected E2E artifacts. Read-only.
set -euo pipefail
RUN_ID="${1:?run id required}"
RUN_DIR="${2:?run dir required}"
REPO="LedgerHQ/ledger-live"
mkdir -p "$RUN_DIR/logs"

if [[ -f "$RUN_DIR/jobs.json" && "${FORCE:-0}" != "1" ]]; then
  echo "jobs.json exists, skipping (set FORCE=1 to redo)"
  exit 0
fi

gh run view "$RUN_ID" --repo "$REPO" \
  --json databaseId,displayTitle,event,headBranch,headSha,createdAt,updatedAt,conclusion,workflowName,jobs \
  --jq '{
    run_id: .databaseId, workflow: .workflowName, title: .displayTitle, event: .event,
    branch: .headBranch, head_sha: .headSha, created_at: .createdAt, updated_at: .updatedAt,
    conclusion: .conclusion,
    failed_jobs: [.jobs[] | select(.conclusion == "failure") |
      {id: .databaseId, name: .name, started_at: .startedAt, completed_at: .completedAt}]
  }' > "$RUN_DIR/jobs.json"

while IFS= read -r job_id; do
  gh api "repos/$REPO/actions/jobs/$job_id/logs" |
    sed -E 's/\x1b\[[0-9;]*m//g; s/^[0-9T:.Z-]+ //' > "$RUN_DIR/logs/$job_id.log"
done < <(jq -r '.failed_jobs[].id' "$RUN_DIR/jobs.json")

mkdir -p "$RUN_DIR/artifacts"
while IFS= read -r artifact; do
  [[ "$artifact" =~ ^(playwright-results-|ios-test-artifacts-|android-test-artifacts-) ]] || continue
  gh run download "$RUN_ID" --repo "$REPO" --name "$artifact" --dir "$RUN_DIR/artifacts/$artifact"
done < <(gh api --paginate "repos/$REPO/actions/runs/$RUN_ID/artifacts" --jq '.artifacts[] | select(.expired == false) | .name')
find "$RUN_DIR/artifacts" -name investigation-context.json -exec cp {} "$RUN_DIR/investigation-context.json" \;

echo "collected $(jq '.failed_jobs | length' "$RUN_DIR/jobs.json") failed job(s) for $RUN_ID"
