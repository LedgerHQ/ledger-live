#!/usr/bin/env bash
# Usage: e2e/tooling/retry-baseline/run.sh <since YYYY-MM-DD> <until YYYY-MM-DD> <work_dir>
# Re-running with the same work_dir resumes: runs already downloaded are skipped.
set -euo pipefail

since=$1
until=$2
work=$3
here=$(cd "$(dirname "$0")" && pwd)
py() { python3 -I "$here/$1" "${@:2}"; }

mkdir -p "$work/runs"
py list_runs.py test-ui-e2e-only-desktop.yml "$since" "$until" > "$work/runs/desktop.tsv"
py list_runs.py test-mobile-e2e-reusable.yml "$since" "$until" > "$work/runs/mobile.tsv"
echo "runs: $(wc -l < "$work/runs/desktop.tsv") desktop, $(wc -l < "$work/runs/mobile.tsv") mobile"

allure_since=$(python3 -I -c 'import datetime; print(datetime.date.today() - datetime.timedelta(days=6))')
py collect.py desktop "$work/runs/desktop.tsv" "$work/desktop" &
py collect.py mobile "$work/runs/mobile.tsv" "$work/mobile" &
py collect_mobile_allure.py "$work/runs/mobile.tsv" "$allure_since" "$work/mobile_allure.jsonl" &
wait

node "$here/spec_teams.mjs" > "$work/spec_teams.json"
py analyze.py "$work"
py summarize.py "$work"
py export.py "$work"
