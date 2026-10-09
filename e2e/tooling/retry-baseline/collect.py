"""Download what analyze.py needs for each run, first attempt only.

Usage: python3 -I collect.py <desktop|mobile> <runs.tsv> <out_dir> [workers]

Per run, in <out_dir>/<run_id>/:
  jobs.json         jobs and steps with timings
  desktop: results.jsonl (one line per Allure *-result.json, every attempt) and artifacts.json
  mobile:  shards/<job>.txt (the shard log lines that delimit attempts and name failed tests)
A run with a `done` marker is skipped, so an interrupted collection can be resumed.
"""
import io
import json
import os
import re
import subprocess
import sys
import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed

REPO = "repos/LedgerHQ/ledger-live"
RATE_LIMIT_FLOOR = 150
ANSI = re.compile(r"\x1b\[[0-9;]*m")
MOBILE_LINES_TO_KEEP = re.compile(
    r"Detox retry: attempt|●|\s(PASS|FAIL)\s+\S+\.spec\.ts|Test Suites:|Tests:\s|Time:\s|"
    r"known-failure|^\S+Z\s+- .+\([A-Z][A-Z0-9]+-\d+\)\s*$|Stall watchdog|detox test -c|"
    r"##\[error\]|exceeded the maximum execution time|The operation was canceled"
)

calls_lock = threading.Lock()
calls = 0


def wait_for_rate_limit():
    global calls
    with calls_lock:
        calls += 1
        if calls % 100:
            return
    out = subprocess.run(["gh", "api", "rate_limit", "-q", ".resources.core | [.remaining, .reset] | @tsv"],
                         capture_output=True, text=True).stdout.split()
    if out and int(out[0]) < RATE_LIMIT_FLOOR:
        wait = max(0, int(out[1]) - time.time()) + 5
        print(f"rate limit low ({out[0]}), sleeping {wait:.0f}s", flush=True)
        time.sleep(wait)


def gh(path, binary=False, tries=4):
    err = ""
    for i in range(tries):
        wait_for_rate_limit()
        p = subprocess.run(["gh", "api", path], capture_output=True)
        if p.returncode == 0:
            return p.stdout if binary else json.loads(p.stdout)
        err = p.stderr.decode(errors="replace")
        if "404" in err or "410" in err or "Gone" in err:
            return None
        time.sleep(5 * (i + 1))
    raise RuntimeError(f"gh api {path} failed: {err[:300]}")


def attachment_bytes(result, sizes):
    total, stack = 0, [result]
    while stack:
        node = stack.pop()
        total += sum(sizes.get(a.get("source", ""), 0) for a in node.get("attachments", []))
        stack.extend(node.get("steps", []))
    return total


def collect_desktop(run_id, run_dir):
    arts = gh(f"{REPO}/actions/runs/{run_id}/artifacts?per_page=100") or {"artifacts": []}
    summary = []
    with open(os.path.join(run_dir, "results.jsonl"), "w") as out:
        for a in arts["artifacts"]:
            if not a["name"].startswith("allure-results") or a["expired"]:
                continue
            blob = gh(f"{REPO}/actions/artifacts/{a['id']}/zip", binary=True)
            if not blob:
                continue
            z = zipfile.ZipFile(io.BytesIO(blob))
            sizes = {os.path.basename(i.filename): i.file_size for i in z.infolist()}
            summary.append({"name": a["name"], "zip_bytes": a["size_in_bytes"], "files": len(sizes),
                            "total_bytes": sum(sizes.values())})
            for info in z.infolist():
                if not info.filename.endswith("-result.json"):
                    continue
                r = json.loads(z.read(info))
                labels = {label["name"]: label["value"] for label in r.get("labels", [])}
                out.write(json.dumps({
                    "artifact": a["name"], "historyId": r.get("historyId"), "fullName": r.get("fullName"),
                    "name": r.get("name"), "status": r.get("status"), "start": r.get("start"), "stop": r.get("stop"),
                    "result_bytes": info.file_size, "attachment_bytes": attachment_bytes(r, sizes),
                    "suite": labels.get("suite"), "team": labels.get("owner"),
                }) + "\n")
    json.dump(summary, open(os.path.join(run_dir, "artifacts.json"), "w"))


def collect_mobile(run_id, run_dir):
    blob = gh(f"{REPO}/actions/runs/{run_id}/attempts/1/logs", binary=True)
    if not blob:
        return
    z = zipfile.ZipFile(io.BytesIO(blob))
    files_by_job = {}
    for info in z.infolist():
        name = info.filename
        if "E2E Tests" not in name or not name.endswith(".txt") or name.endswith("system.txt"):
            continue
        if "/" in name:
            job, step = name.split("/", 1)
            step_index = re.match(r"\d+", step)
            files_by_job.setdefault(job, []).append((int(step_index.group()) if step_index else 0, name))
        else:
            files_by_job.setdefault(re.sub(r"^\d+_", "", name[:-4]), []).append((0, name))
    os.makedirs(os.path.join(run_dir, "shards"), exist_ok=True)
    for job, files in files_by_job.items():
        kept = []
        for _, name in sorted(files):
            for line in z.read(name).decode(errors="replace").splitlines():
                line = ANSI.sub("", line)
                if MOBILE_LINES_TO_KEEP.search(line):
                    kept.append(line[:400])
        safe_name = re.sub(r"[^A-Za-z0-9_.()-]+", "_", job)
        open(os.path.join(run_dir, "shards", safe_name + ".txt"), "w").write("\n".join(kept))


def collect(platform, out_dir, run_id):
    run_dir = os.path.join(out_dir, run_id)
    if os.path.exists(os.path.join(run_dir, "done")):
        return
    os.makedirs(run_dir, exist_ok=True)
    json.dump(gh(f"{REPO}/actions/runs/{run_id}/attempts/1/jobs?per_page=100"), open(os.path.join(run_dir, "jobs.json"), "w"))
    (collect_desktop if platform == "desktop" else collect_mobile)(run_id, run_dir)
    open(os.path.join(run_dir, "done"), "w").close()


def main():
    platform, runs_tsv, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    workers = int(sys.argv[4]) if len(sys.argv) > 4 else 8
    runs = [line.split("\t", 1)[0] for line in open(runs_tsv) if line.strip()]
    done = errors = 0
    with ThreadPoolExecutor(workers) as ex:
        futures = {ex.submit(collect, platform, out_dir, run_id): run_id for run_id in runs}
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                errors += 1
                print(f"ERR {futures[future]}: {e}", flush=True)
            done += 1
            if done % 50 == 0:
                print(f"{platform}: {done}/{len(runs)} errors={errors}", flush=True)
    print(f"{platform}: finished {done}/{len(runs)} errors={errors}", flush=True)


main()
