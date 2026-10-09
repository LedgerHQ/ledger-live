"""Measure how much of the mobile Allure data comes from retried attempts.

Usage: python3 -I collect_mobile_allure.py <runs.tsv> <since ISO date> <out.jsonl> [workers]

Raw mobile Allure results only live in the per-shard *-test-artifacts-N artifacts, which expire after
7 days, so only recent runs can be measured. One JSON line per shard; reruns skip runs already written.
"""
import collections
import io
import json
import os
import re
import subprocess
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed

REPO = "repos/LedgerHQ/ledger-live"
SHARD_ARTIFACT = re.compile(r"^(ios|android)-test-artifacts-(\d+)$")


def gh(path, binary=False):
    for i in range(4):
        p = subprocess.run(["gh", "api", path], capture_output=True)
        if p.returncode == 0:
            return p.stdout if binary else json.loads(p.stdout)
        if b"404" in p.stderr or b"410" in p.stderr:
            return None
        time.sleep(5 * (i + 1))
    return None


def measure(blob):
    """Allure bytes per attempt. 0 retries drops every non-final attempt, 1 retry the middle one of three."""
    z = zipfile.ZipFile(io.BytesIO(blob))
    infos = [i for i in z.infolist() if not i.is_dir()]
    size = {i.filename: i.file_size for i in infos}
    attempts = collections.defaultdict(list)
    for info in infos:
        if not info.filename.endswith("-result.json"):
            continue
        r = json.loads(z.read(info))
        prefix = info.filename[: -len(os.path.basename(info.filename))]
        sources, stack = [], [r]
        while stack:
            node = stack.pop()
            sources += [prefix + a.get("source", "") for a in node.get("attachments", [])]
            stack.extend(node.get("steps", []))
        attempts[r.get("historyId") or r.get("fullName")].append(
            (r.get("start") or 0, info.file_size + sum(size.get(s, 0) for s in sources)))
    containers = sum(i.file_size for i in infos if i.filename.endswith("-container.json"))
    allure_bytes = sum(b for test in attempts.values() for _, b in test) + containers
    saved_at_0 = saved_at_1 = 0
    for test in attempts.values():
        test.sort()
        saved_at_0 += sum(b for _, b in test[:-1])
        saved_at_1 += test[1][1] if len(test) == 3 else 0
    return dict(total_bytes=sum(size.values()), allure_bytes=allure_bytes, tests=len(attempts),
                retried_tests=sum(1 for test in attempts.values() if len(test) > 1),
                retry_bytes=saved_at_0, retry3_bytes=saved_at_1)


def measure_run(run_id):
    arts = gh(f"{REPO}/actions/runs/{run_id}/artifacts?per_page=100") or {"artifacts": []}
    rows = []
    for a in arts["artifacts"]:
        m = SHARD_ARTIFACT.match(a["name"])
        if not m or a["expired"]:
            continue
        blob = gh(f"{REPO}/actions/artifacts/{a['id']}/zip", binary=True)
        if blob:
            rows.append(dict(run=run_id, platform=m.group(1), shard=int(m.group(2)), zip_bytes=a["size_in_bytes"],
                             **measure(blob)))
    return rows


def main():
    runs_tsv, since, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    workers = int(sys.argv[4]) if len(sys.argv) > 4 else 6
    runs = [line.split("\t") for line in open(runs_tsv) if line.strip()]
    runs = [(r[0], r[1]) for r in runs if r[4] >= since]
    done_ids = {json.loads(line)["run"] for line in open(out_path)} if os.path.exists(out_path) else set()
    with open(out_path, "a") as out, ThreadPoolExecutor(workers) as ex:
        futures = {ex.submit(measure_run, run_id): (run_id, event) for run_id, event in runs if run_id not in done_ids}
        for n, future in enumerate(as_completed(futures), 1):
            run_id, event = futures[future]
            try:
                for row in future.result():
                    out.write(json.dumps(dict(row, event=event)) + "\n")
                out.flush()
            except Exception as e:
                print(f"ERR {run_id}: {e}", flush=True)
            if n % 20 == 0:
                print(f"mobile allure: {n}/{len(futures)}", flush=True)
    print("mobile allure: done", flush=True)


main()
