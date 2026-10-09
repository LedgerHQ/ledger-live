"""Classify every test of every collected run by what its retries did.

Usage: python3 -I analyze.py <work_dir>
Reads <work_dir>/runs/*.tsv and what collect.py wrote; writes <work_dir>/out/{runs,tests}_{desktop,mobile}.json.

For each run: tests passed first time, rescued on attempt 2 or 3, or failed every attempt; the time those
retries took; and whether the run would have failed with 1 retry (red_R1) or none (red_R0). red_R2 is today.
"""
import collections
import json
import os
import re
import sys
from datetime import datetime

WORK = sys.argv[1]
OUT = os.path.join(WORK, "out")
MOBILE_RETRIES_ONLY_FAILING_TESTS_SINCE = "2026-08-28"
FAILED = ("failed", "broken")


def timestamp(iso):
    iso = iso.rstrip("Z")
    if "." in iso:
        whole, fraction = iso.split(".")
        iso = f"{whole}.{fraction[:6]}"
    return datetime.fromisoformat(iso).timestamp()


def seconds(start, end):
    return timestamp(end) - timestamp(start) if start and end else 0.0


def load_runs(platform):
    runs = {}
    for line in open(os.path.join(WORK, "runs", platform + ".tsv")):
        f = line.rstrip("\n").split("\t")
        runs[f[0]] = dict(id=f[0], event=f[1], branch=f[2], conclusion=f[3], created=f[4], attempts=int(f[7]))
    return runs


def test_jobs(run_dir, is_test_job):
    try:
        jobs = json.load(open(os.path.join(run_dir, "jobs.json"))) or {}
    except (OSError, ValueError):
        return []
    return [j for j in jobs.get("jobs", []) if is_test_job(j["name"])]


def step_seconds(job, step_name):
    step = next((s for s in job.get("steps", []) if re.search(step_name, s["name"])), None)
    return seconds(step.get("started_at"), step.get("completed_at")) if step else 0.0


def job_timings(jobs, step_name):
    return dict(job_s=sum(seconds(j["started_at"], j["completed_at"]) for j in jobs),
                test_step_s=sum(step_seconds(j, step_name) for j in jobs),
                job_conclusions=[j["conclusion"] for j in jobs])


def set_counterfactuals(run, counts, hard_failures):
    run["red_R2"] = hard_failures > 0
    run["red_R1"] = hard_failures > 0 or counts["rescued_at_3"] > 0
    run["red_R0"] = run["red_R1"] or counts["rescued_at_2"] > 0


def analyze_desktop_run(run, run_dir, tests):
    attempts_by_test = collections.defaultdict(list)
    for line in open(os.path.join(run_dir, "results.jsonl")):
        r = json.loads(line)
        attempts_by_test[(r["artifact"], r["historyId"] or r["fullName"])].append(r)
    run["allure_bytes"] = sum(a["total_bytes"] for a in json.load(open(os.path.join(run_dir, "artifacts.json"))))
    run["has_results"] = bool(attempts_by_test)
    if not attempts_by_test:
        return
    run["repeat_run"] = any(len(a) > 3 for a in attempts_by_test.values())
    counts, rescued_keys = collections.Counter(), []
    test_s = retry_s = rescued_retry_s = wasted_retry_s = third_attempt_s = 0.0
    saved_bytes_R0 = saved_bytes_R1 = 0
    first_end, last_end, second_end = (collections.defaultdict(float) for _ in range(3))
    for (artifact, _), attempts in attempts_by_test.items():
        attempts.sort(key=lambda a: a["start"] or 0)
        statuses = [a["status"] for a in attempts]
        durations = [((a["stop"] or 0) - (a["start"] or 0)) / 1000 for a in attempts]
        test_s += sum(durations)
        for i, a in enumerate(attempts):
            stop = (a["stop"] or 0) / 1000
            last_end[artifact] = max(last_end[artifact], stop)
            if i <= 1:
                second_end[artifact] = max(second_end[artifact], stop)
            # Video and extra logs are captured on the last attempt only (isLastRetry), so fewer retries
            # drop the earlier attempts rather than the last one.
            attempt_bytes = a["result_bytes"] + a["attachment_bytes"]
            saved_bytes_R0 += attempt_bytes if i < len(attempts) - 1 else 0
            saved_bytes_R1 += attempt_bytes if len(attempts) == 3 and i == 1 else 0
        first_end[artifact] = max(first_end[artifact], (attempts[0]["stop"] or 0) / 1000)
        key = f'{attempts[-1]["suite"]} › {attempts[-1]["name"]}'
        test = tests[key]
        test["team:" + str(attempts[-1]["team"])] = 1
        if statuses[-1] == "skipped":
            counts["skipped"] += 1
            continue
        retried_s = sum(durations[1:])
        if statuses[-1] == "passed" and not any(s in FAILED for s in statuses):
            counts["passed_first"] += 1
        elif statuses[-1] == "passed":
            counts[f"rescued_at_{len(attempts)}"] += 1
            test[f"rescued_at_{len(attempts)}"] += 1
            rescued_keys.append(key)
            rescued_retry_s += retried_s
        else:
            counts[f"failed_all_{len(attempts)}"] += 1
            test["failed_all"] += 1
            wasted_retry_s += retried_s
        retry_s += retried_s
        third_attempt_s += sum(durations[2:])
    run.update(counts=dict(counts), rescued_keys=rescued_keys, test_s=test_s, retry_s=retry_s,
               rescued_retry_s=rescued_retry_s, wasted_retry_s=wasted_retry_s, third_s=third_attempt_s,
               allure_bytes_retry=saved_bytes_R0, allure_bytes_retry3=saved_bytes_R1,
               tail_ext_s=sum(max(0.0, last_end[a] - first_end[a]) for a in last_end),
               tail_ext_R1_s=sum(max(0.0, second_end[a] - first_end[a]) for a in last_end))
    set_counterfactuals(run, counts, sum(v for k, v in counts.items() if k.startswith("failed_all")))


def analyze_desktop():
    runs, tests = [], collections.defaultdict(collections.Counter)
    for run_id, meta in load_runs("desktop").items():
        run_dir = os.path.join(WORK, "desktop", run_id)
        if not os.path.exists(os.path.join(run_dir, "done")):
            continue
        run = dict(meta, platform="desktop", **job_timings(
            test_jobs(run_dir, lambda name: name.startswith("Desktop E2E")), r"Run Playwright E2E tests"))
        analyze_desktop_run(run, run_dir, tests)
        runs.append(run)
    return runs, tests


LOG_LINE = re.compile(r"^(\S+Z)\s?(.*)$")
SPEC_RESULT = re.compile(r"^\s*(PASS|FAIL)\s+(\S+\.spec\.ts)")
FAILED_TEST = re.compile(r"●\s+(.+?)\s*$")
TESTS_SUMMARY = re.compile(r"^Tests:\s+(.*)$")
ATTEMPT_END = re.compile(r"^Time:\s+[\d.]+ s")
KNOWN_FAILURE = re.compile(r"^\s*- (.+) \(([A-Z][A-Z0-9]+-\d+)\)\s*$")
SUITE_FAILED = "Test suite failed to run"


def normalize(name):
    return re.sub(r"\s+", " ", name.replace("›", " ")).strip()


def new_attempt(start):
    return dict(start=start, failed=set(), fail_specs=set(), pass_specs=set(), tests=None, n_failed=None)


def parse_shard(path):
    """Split a shard log into attempts, each ending with Jest's "Time:" line, and collect the failed tests."""
    attempts, current, known, spec_of, last_failed_spec = [], None, set(), {}, None
    for raw in open(path, errors="replace"):
        m = LOG_LINE.match(raw.rstrip("\n"))
        if not m:
            continue
        at, body = m.group(1), m.group(2)
        if "detox test -c" in body:
            current = current or new_attempt(at)
            continue
        if body.startswith("##[error]"):
            continue
        known_failure = KNOWN_FAILURE.match(body)
        if known_failure:
            known.add(normalize(known_failure.group(1)))
            continue
        current = current or new_attempt(at)
        spec_result = SPEC_RESULT.match(body)
        if spec_result:
            outcome, spec = spec_result.groups()
            (current["fail_specs"] if outcome == "FAIL" else current["pass_specs"]).add(spec)
            last_failed_spec = spec if outcome == "FAIL" and not body.startswith(" ") else None
            continue
        failed_test = FAILED_TEST.search(body)
        if failed_test:
            name = normalize(failed_test.group(1))
            if name == SUITE_FAILED:
                if not last_failed_spec:
                    continue
                name = f"{last_failed_spec} :: {SUITE_FAILED}"
            current["failed"].add(name)
            if last_failed_spec:
                spec_of.setdefault(name, last_failed_spec)
            continue
        last_failed_spec = None
        summary = TESTS_SUMMARY.match(body.strip())
        if summary:
            current["tests"] = summary.group(1)
            n_failed = re.search(r"(\d+) failed", summary.group(1))
            current["n_failed"] = int(n_failed.group(1)) if n_failed else 0
            continue
        if ATTEMPT_END.match(body.strip()):
            current["end"] = at
            attempts.append(current)
            current = new_attempt(at)
    incomplete = bool(current and (current["failed"] or current["fail_specs"] or current["pass_specs"]))
    return dict(attempts=attempts, incomplete=incomplete, known=known, spec_of=spec_of)


def analyze_mobile_platform(run, shard_jobs, run_dir, tests):
    counts, rescued_keys = collections.Counter(), []
    retry_s = rescued_retry_s = wasted_retry_s = third_attempt_s = 0.0
    parsed_shards = known_failures = 0
    for name in shard_jobs:
        log = os.path.join(run_dir, "shards", name + ".txt")
        shard = parse_shard(log) if os.path.exists(log) else None
        if not shard or not shard["attempts"]:
            continue
        parsed_shards += 1
        attempts = shard["attempts"]
        failed = [a["failed"] for a in attempts]
        shard_retry_s = sum(seconds(a["start"], a["end"]) for a in attempts[1:])
        retry_s += shard_retry_s
        third_attempt_s += sum(seconds(a["start"], a["end"]) for a in attempts[2:])
        known = failed[0] & shard["known"]
        known_failures += len(known)
        counts["attempts_checked"] += len(attempts)
        counts["count_mismatch"] += sum(
            1 for a in attempts
            if a["n_failed"] is not None and a["n_failed"] != sum(1 for t in a["failed"] if not t.endswith(SUITE_FAILED)))
        passed = re.search(r"(\d+) passed", attempts[0]["tests"] or "")
        counts["passed_first"] += int(passed.group(1)) if passed else 0
        shard_rescued = shard_failed = 0
        for key in failed[0] - known:
            test = tests[key]
            test["spec:" + shard["spec_of"].get(key, "?")] = 1
            rescued_on = next((k + 1 for k in range(1, len(attempts)) if key not in failed[k]), None)
            if rescued_on:
                outcome = f"rescued_at_{rescued_on}"
                rescued_keys.append(key)
                shard_rescued += 1
            elif not shard["incomplete"] or len(attempts) >= 3:
                outcome = "failed_all"
                shard_failed += 1
            else:
                outcome = "unknown"
            counts[outcome] += 1
            test[outcome] += 1
        counts["collateral"] += sum(len(failed[k] - failed[0]) for k in range(1, len(attempts)))
        if shard_rescued + shard_failed:
            rescued_retry_s += shard_retry_s * shard_rescued / (shard_rescued + shard_failed)
            wasted_retry_s += shard_retry_s * shard_failed / (shard_rescued + shard_failed)
        counts["incomplete_shards"] += shard["incomplete"]
    run.update(counts=dict(counts), rescued_keys=rescued_keys, parsed_shards=parsed_shards, known=known_failures,
               retry_s=retry_s, rescued_retry_s=rescued_retry_s, wasted_retry_s=wasted_retry_s, third_s=third_attempt_s,
               complete=parsed_shards == len(shard_jobs) and not counts["incomplete_shards"])
    set_counterfactuals(run, counts, counts["failed_all"] + known_failures + counts["unknown"])


def analyze_mobile():
    runs, tests = [], collections.defaultdict(collections.Counter)
    for run_id, meta in load_runs("mobile").items():
        run_dir = os.path.join(WORK, "mobile", run_id)
        if not os.path.exists(os.path.join(run_dir, "done")):
            continue
        jobs = {re.sub(r"[^A-Za-z0-9_.()-]+", "_", j["name"]): j
                for j in test_jobs(run_dir, lambda name: "E2E Tests" in name)}
        for platform in ("iOS", "Android"):
            shard_jobs = {k: v for k, v in jobs.items() if k.startswith(platform)}
            if not shard_jobs:
                continue
            run = dict(meta, platform=platform, shards=len(shard_jobs),
                       new_retry=meta["created"] >= MOBILE_RETRIES_ONLY_FAILING_TESTS_SINCE,
                       **job_timings(shard_jobs.values(), r"Detox shard"))
            analyze_mobile_platform(run, shard_jobs, run_dir, tests)
            runs.append(run)
    return runs, tests


def main():
    os.makedirs(OUT, exist_ok=True)
    desktop_runs, desktop_tests = analyze_desktop()
    mobile_runs, mobile_tests = analyze_mobile()
    for name, data in (("runs_desktop", desktop_runs), ("runs_mobile", mobile_runs),
                       ("tests_desktop", desktop_tests), ("tests_mobile", mobile_tests)):
        json.dump(data, open(os.path.join(OUT, name + ".json"), "w"), indent=0)
    print(f"analysed {len(desktop_runs)} desktop runs and {len(mobile_runs)} mobile platform runs")


main()
