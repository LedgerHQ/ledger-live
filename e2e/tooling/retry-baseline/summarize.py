"""Aggregate analyze.py output per platform and trigger.

Usage: python3 -I summarize.py <work_dir>
Writes <work_dir>/out/summary.json and <work_dir>/out/fix_top_n.json, and prints the headline numbers.
"""
import collections
import json
import os
import statistics
import sys

WORK = sys.argv[1]
OUT = os.path.join(WORK, "out")
FIX_TOP_N = (0, 5, 10, 20, 50)


def load(name):
    return json.load(open(os.path.join(OUT, name + ".json")))


def pct(part, whole):
    return round(100.0 * part / whole, 1) if whole else None


def minutes(s):
    return round(s / 60.0, 1)


def analysed(runs):
    return [r for r in runs if (r.get("has_results") and not r.get("repeat_run")) or (r.get("complete") and r.get("parsed_shards"))]


def aggregate(rows, timed_rows):
    counts = collections.Counter()
    for r in rows:
        counts.update(r["counts"])
    failed_all = sum(v for k, v in counts.items() if k.startswith("failed_all"))
    first_failures = counts["rescued_at_2"] + counts["rescued_at_3"] + failed_all + counts["unknown"]
    red = {setting: sum(r[f"red_{setting}"] for r in rows) for setting in ("R2", "R1", "R0")}
    green = len(rows) - red["R2"]
    total = lambda key: sum(r.get(key, 0) for r in timed_rows)
    is_desktop = rows[0]["platform"] == "desktop"
    out = dict(
        runs=len(rows), test_executions=counts["passed_first"] + first_failures,
        test_failures_first_attempt=first_failures, rescued_at_2=counts["rescued_at_2"],
        rescued_at_3=counts["rescued_at_3"], failed_all=failed_all,
        runs_red_R2=red["R2"], pct_runs_red_R2=pct(red["R2"], len(rows)),
        pct_runs_red_R1=pct(red["R1"], len(rows)), pct_runs_red_R0=pct(red["R0"], len(rows)),
        green_runs_turning_red_R1=red["R1"] - red["R2"], green_runs_turning_red_R0=red["R0"] - red["R2"],
        pct_green_turning_red_R1=pct(red["R1"] - red["R2"], green), pct_green_turning_red_R0=pct(red["R0"] - red["R2"], green),
        time_runs=len(timed_rows), job_min=minutes(total("job_s")), test_step_min=minutes(total("test_step_s")),
        retry_min=minutes(total("retry_s")), saved_R1_min=minutes(total("third_s")),
        retry_rescued_min=minutes(total("rescued_retry_s")), retry_wasted_min=minutes(total("wasted_retry_s")),
        pct_wasted_of_retry=pct(total("wasted_retry_s"), total("retry_s")),
        pct_retry_of_test_time=pct(total("retry_s"), total("test_s") if is_desktop else total("test_step_s")),
    )
    if is_desktop:
        delays = [r["tail_ext_s"] for r in rows if r.get("retry_s")]
        out.update(tail_ext_min=minutes(total("tail_ext_s")),
                   tail_ext_saved_R1_min=minutes(total("tail_ext_s") - total("tail_ext_R1_s")),
                   median_tail_ext_s_when_retried=round(statistics.median(delays)) if delays else 0,
                   allure_mb=round(total("allure_bytes") / 1e6, 1),
                   allure_saved_R0_mb=round(total("allure_bytes_retry") / 1e6, 1),
                   pct_allure_saved_R0=pct(total("allure_bytes_retry"), total("allure_bytes")),
                   pct_allure_saved_R1=pct(total("allure_bytes_retry3"), total("allure_bytes")))
    return out


def fix_top_n(runs_by_platform):
    """Passing branch runs 0 retries would turn red, if the N tests behind the most such runs were fixed first."""
    rows = []
    for platform, runs in runs_by_platform.items():
        branch = [r for r in runs if r["event"] != "schedule"]
        lost = [r for r in branch if not r["red_R2"] and r["red_R0"]]
        breaking = collections.Counter(k for r in lost for k in set(r["rescued_keys"]))
        green = sum(1 for r in branch if not r["red_R2"])
        for n in FIX_TOP_N:
            fixed = {k for k, _ in breaking.most_common(n)}
            still_lost = sum(1 for r in lost if set(r["rescued_keys"]) - fixed)
            rows.append(dict(platform=platform, fixed_tests=n, green_branch_runs=green,
                             lost_at_0_retries=still_lost, pct_lost_at_0_retries=pct(still_lost, green)))
    return rows


def mobile_allure_sample():
    path = os.path.join(WORK, "mobile_allure.jsonl")
    if not os.path.exists(path):
        return {}
    rows = [json.loads(line) for line in open(path)]
    out = {}
    for platform in ("ios", "android"):
        shards = [r for r in rows if r["platform"] == platform]
        if shards:
            total = lambda key: sum(r[key] for r in shards)
            out[platform] = dict(shards=len(shards), runs=len({r["run"] for r in shards}),
                                 allure_mb=round(total("allure_bytes") / 1e6, 1),
                                 saved_R0_mb=round(total("retry_bytes") / 1e6, 1),
                                 pct_saved_R0=pct(total("retry_bytes"), total("allure_bytes")),
                                 pct_saved_R1=pct(total("retry3_bytes"), total("allure_bytes")),
                                 artifact_mb=round(total("total_bytes") / 1e6, 1))
    return out


def main():
    desktop_all, mobile_all = load("runs_desktop"), load("runs_mobile")
    runs = analysed(desktop_all) + analysed(mobile_all)
    by_platform = {p: [r for r in runs if r["platform"] == p] for p in ("desktop", "iOS", "Android")}
    segments = {}
    for platform, rows in by_platform.items():
        timed = [r for r in rows if platform == "desktop" or r["new_retry"]]
        for trigger, keep in (("branch", lambda r: r["event"] != "schedule"), ("nightly", lambda r: r["event"] == "schedule"),
                              ("all", lambda r: True)):
            selected = [r for r in rows if keep(r)]
            if selected:
                segments[f"{platform}/{trigger}"] = aggregate(selected, [r for r in timed if keep(r)])
    skipped_platform = lambda r: set(r["job_conclusions"]) <= {"skipped"}
    analysed_mobile = {(r["id"], r["platform"]) for r in analysed(mobile_all)}
    meta = dict(
        desktop_runs_collected=len(desktop_all),
        desktop_runs_with_results=sum(1 for r in desktop_all if r.get("has_results")),
        desktop_repeat_runs_excluded=sum(1 for r in desktop_all if r.get("repeat_run")),
        mobile_platform_runs_collected=len(mobile_all),
        mobile_platform_runs_complete=len(analysed_mobile),
        mobile_platform_not_selected=sum(1 for r in mobile_all if skipped_platform(r)),
        mobile_cancelled_or_infra_failed=sum(
            1 for r in mobile_all if (r["id"], r["platform"]) not in analysed_mobile and not skipped_platform(r)),
        mobile_attempts_checked=sum(r["counts"].get("attempts_checked", 0) for r in mobile_all),
        mobile_count_mismatch_attempts=sum(r["counts"].get("count_mismatch", 0) for r in mobile_all),
        human_reruns={"desktop": sum(1 for r in desktop_all if r["attempts"] > 1),
                      "mobile": len({r["id"] for r in mobile_all if r["attempts"] > 1})},
        window={"from": min(r["created"] for r in runs)[:10], "to": max(r["created"] for r in runs)[:10]} if runs else None,
        mobile_allure=mobile_allure_sample(),
    )
    json.dump(dict(segments=segments, meta=meta), open(os.path.join(OUT, "summary.json"), "w"), indent=1)
    json.dump(fix_top_n({"Desktop": by_platform["desktop"], "iOS": by_platform["iOS"], "Android": by_platform["Android"]}),
              open(os.path.join(OUT, "fix_top_n.json"), "w"), indent=1)
    for key, s in segments.items():
        if key.endswith("/branch"):
            print(f"{key}: {s['runs']} runs, passing runs lost at 1 retry {s['pct_green_turning_red_R1']}%, "
                  f"at 0 retries {s['pct_green_turning_red_R0']}%, retry time wasted {s['pct_wasted_of_retry']}%")


main()
