"""List the runs of one workflow between two dates, as TSV.

Usage: python3 -I list_runs.py <workflow file> <since YYYY-MM-DD> <until YYYY-MM-DD> > runs.tsv

GitHub caps a filtered run listing at 1000 results, so the window is listed in 10-day chunks.
"""
import subprocess
import sys
from datetime import date, timedelta

REPO = "repos/LedgerHQ/ledger-live"
CHUNK_DAYS = 10
FIELDS = "[.id, .event, .head_branch, (.conclusion // \"none\"), .created_at, .run_started_at, .updated_at, .run_attempt] | @tsv"

workflow, since, until = sys.argv[1], date.fromisoformat(sys.argv[2]), date.fromisoformat(sys.argv[3])
seen = set()
start = since
while True:
    end = min(start + timedelta(days=CHUNK_DAYS), until)
    out = subprocess.run(
        ["gh", "api", "--paginate", f"{REPO}/actions/workflows/{workflow}/runs?per_page=100&created={start}..{end}",
         "-q", f".workflow_runs[] | {FIELDS}"],
        check=True, capture_output=True, text=True).stdout
    chunk = [line for line in out.splitlines() if line.strip()]
    if len(chunk) >= 1000:
        sys.exit(f"{start}..{end} hit GitHub's 1000-run cap; lower CHUNK_DAYS")
    for line in chunk:
        run_id = line.split("\t", 1)[0]
        if run_id not in seen:
            seen.add(run_id)
            print(line)
    if end == until:
        break
    start = end
