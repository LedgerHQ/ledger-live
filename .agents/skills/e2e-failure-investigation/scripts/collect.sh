#!/usr/bin/env bash
# Usage: collect.sh <run_id> <run_dir>
# Writes <run_dir>/jobs.json and logs/<job_id>.log for failed jobs. Read-only.
set -euo pipefail
RUN_ID="${1:?run id required}"
RUN_DIR="${2:?run dir required}"
REPO="${REPO:-LedgerHQ/ledger-live}"
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

echo "collected $(jq '.failed_jobs | length' "$RUN_DIR/jobs.json") failed job(s) for $RUN_ID"
