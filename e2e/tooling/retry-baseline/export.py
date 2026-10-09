"""Write the dashboard datasets: one JSON array of row objects per file.

Usage: python3 -I export.py <work_dir>   -> <work_dir>/export/*.json
"""
import collections
import json
import os
import sys
from datetime import date, datetime, timedelta

WORK = sys.argv[1]
OUT = os.path.join(WORK, "out")
EXPORT = os.path.join(WORK, "export")
PLATFORM_LABEL = {"desktop": "Desktop", "iOS": "iOS", "Android": "Android"}
TRIGGER_LABEL = {"branch": "Branch runs", "nightly": "Nightly", "all": "All runs"}
TOP_TESTS = 20


def load(name):
    return json.load(open(os.path.join(OUT, name + ".json")))


def round1(x):
    return None if x is None else round(x, 1)


def share(part, whole, per=100):
    return round1(per * part / whole) if whole else None


def dump(name, rows):
    json.dump(rows, open(os.path.join(EXPORT, name + ".json"), "w"), indent=0)
    print(f"{name}: {len(rows)} rows")


def segments(summary):
    rows = []
    for key, s in summary["segments"].items():
        platform, trigger = key.split("/")
        first = s["test_failures_first_attempt"]
        rows.append(dict(
            segment=f"{PLATFORM_LABEL[platform]} · {TRIGGER_LABEL[trigger]}",
            platform=PLATFORM_LABEL[platform], trigger=TRIGGER_LABEL[trigger],
            runs=s["runs"], test_executions=s["test_executions"], first_attempt_failures=first,
            rescued_by_attempt_2=s["rescued_at_2"], rescued_by_attempt_3=s["rescued_at_3"], never_rescued=s["failed_all"],
            share_rescued_by_2=share(s["rescued_at_2"], first), share_rescued_by_3=share(s["rescued_at_3"], first),
            share_never_rescued=share(s["failed_all"], first),
            rescued_per_1000_executions=share(s["rescued_at_2"] + s["rescued_at_3"], s["test_executions"], per=1000),
            green_runs=s["runs"] - s["runs_red_R2"],
            pct_runs_failing_2_retries=s["pct_runs_red_R2"], pct_runs_failing_1_retry=s["pct_runs_red_R1"],
            pct_runs_failing_0_retries=s["pct_runs_red_R0"],
            green_runs_lost_at_1_retry=s["green_runs_turning_red_R1"], green_runs_lost_at_0_retries=s["green_runs_turning_red_R0"],
            pct_green_lost_at_1_retry=s["pct_green_turning_red_R1"], pct_green_lost_at_0_retries=s["pct_green_turning_red_R0"],
            timed_runs=s["time_runs"], job_minutes=s["job_min"], test_step_minutes=s["test_step_min"],
            retry_minutes=s["retry_min"], retry_minutes_rescuing=s["retry_rescued_min"],
            retry_minutes_wasted=s["retry_wasted_min"], retry_minutes_saved_at_1_retry=s["saved_R1_min"],
            pct_retry_minutes_wasted=s["pct_wasted_of_retry"], pct_test_time_in_retries=s["pct_retry_of_test_time"],
            run_end_delay_minutes=s.get("tail_ext_min"),
            run_end_delay_saved_at_1_retry_minutes=s.get("tail_ext_saved_R1_min"),
            median_run_end_delay_seconds=s.get("median_tail_ext_s_when_retried"),
        ))
    platform_order, trigger_order = list(PLATFORM_LABEL.values()), list(TRIGGER_LABEL.values())
    return sorted(rows, key=lambda r: (trigger_order.index(r["trigger"]), platform_order.index(r["platform"])))


def allure(summary):
    desktop, window = summary["segments"]["desktop/all"], summary["meta"]["window"]
    days = (date.fromisoformat(window["to"]) - date.fromisoformat(window["from"])).days + 1
    rows = [dict(platform="Desktop", window=f"{days} days", runs=desktop["runs"], allure_mb=desktop["allure_mb"],
                 saved_mb_at_0_retries=desktop["allure_saved_R0_mb"], pct_saved_at_0_retries=desktop["pct_allure_saved_R0"],
                 pct_saved_at_1_retry=desktop["pct_allure_saved_R1"])]
    for platform, label in (("ios", "iOS"), ("android", "Android")):
        m = summary["meta"]["mobile_allure"].get(platform)
        if m:
            rows.append(dict(platform=label, window="Sample of last 7 days", runs=m["runs"], allure_mb=m["allure_mb"],
                             saved_mb_at_0_retries=m["saved_R0_mb"], pct_saved_at_0_retries=m["pct_saved_R0"],
                             pct_saved_at_1_retry=m["pct_saved_R1"], shard_artifacts_mb=m["artifact_mb"]))
    return rows


def weekly(runs):
    weeks = collections.defaultdict(collections.Counter)
    for r in runs:
        day = datetime.fromisoformat(r["created"].rstrip("Z"))
        week = weeks[((day - timedelta(days=day.weekday())).strftime("%Y-%m-%d"), PLATFORM_LABEL[r["platform"]])]
        c = r["counts"]
        failed_all = sum(v for k, v in c.items() if k.startswith("failed_all"))
        rescued = c.get("rescued_at_2", 0) + c.get("rescued_at_3", 0)
        week["executions"] += c.get("passed_first", 0) + rescued + failed_all + c.get("unknown", 0)
        week["rescued"] += rescued
        week["never_rescued"] += failed_all
        week["runs"] += 1
    return [dict(week=w, platform=p, runs=v["runs"], test_executions=v["executions"], rescued=v["rescued"],
                 never_rescued=v["never_rescued"], rescued_per_1000=share(v["rescued"], v["executions"], per=1000))
            for (w, p), v in sorted(weeks.items())]


def tests(spec_teams):
    rows = []
    for source, platform in (("desktop", "Desktop"), ("mobile", "Mobile")):
        for name, t in load(f"tests_{source}").items():
            rescued, never = t.get("rescued_at_2", 0) + t.get("rescued_at_3", 0), t.get("failed_all", 0)
            if not rescued and not never:
                continue
            if platform == "Desktop":
                spec, title = name.split(" › ", 1)
                team = next((k[5:] for k in t if k.startswith("team:")), "?")
            else:
                spec, title = next((k[5:] for k in t if k.startswith("spec:") and k != "spec:?"), "?"), name
                team = ", ".join(spec_teams.get(spec, ["?"]))
            rows.append(dict(platform=platform, test=title, spec=spec.replace("specs/", ""), team=team, rescued=rescued,
                             rescued_only_by_attempt_3=t.get("rescued_at_3", 0), never_rescued=never))
    return rows


def top(rows, field, prefix):
    picked = []
    for platform in ("Desktop", "Mobile"):
        candidates = [r for r in rows if r["platform"] == platform and r[field]]
        picked += sorted(candidates, key=lambda r: (-r[field], r["test"]))[:TOP_TESTS]
    return [dict(r, id=f"{prefix}{i + 1}") for i, r in enumerate(picked)]


def rescued_by_team(rows):
    by_team = collections.Counter()
    for r in rows:
        for team in r["team"].split(", "):
            by_team[(r["platform"], team.replace(" (spec removed)", ""))] += r["rescued"]
    return [dict(platform=p, team=t, rescued=n) for (p, t), n in by_team.most_common() if n]


def coverage(summary):
    m = summary["meta"]
    return [dict(item=item, value=value) for item, value in (
        ("Desktop runs listed", m["desktop_runs_collected"]),
        ("Desktop runs with Allure results", m["desktop_runs_with_results"]),
        ("Desktop repeat-each runs left out", m["desktop_repeat_runs_excluded"]),
        ("Desktop runs analysed", summary["segments"]["desktop/all"]["runs"]),
        ("Mobile platform runs listed", m["mobile_platform_runs_collected"]),
        ("Mobile platform not selected in the run", m["mobile_platform_not_selected"]),
        ("Mobile cancelled or failed before tests ran", m["mobile_cancelled_or_infra_failed"]),
        ("Mobile platform runs analysed", m["mobile_platform_runs_complete"]),
        ("Mobile attempts parsed", m["mobile_attempts_checked"]),
        ("Mobile attempts disagreeing with Jest's count", m["mobile_count_mismatch_attempts"]),
        ("Runs re-run by hand (desktop)", m["human_reruns"]["desktop"]),
        ("Runs re-run by hand (mobile)", m["human_reruns"]["mobile"]),
    )]


def main():
    os.makedirs(EXPORT, exist_ok=True)
    summary = load("summary")
    runs = [r for r in load("runs_desktop") if r.get("has_results") and not r.get("repeat_run")]
    runs += [r for r in load("runs_mobile") if r.get("complete") and r.get("parsed_shards")]
    test_rows = tests(json.load(open(os.path.join(WORK, "spec_teams.json"))))
    dump("segments", segments(summary))
    dump("allure", allure(summary))
    dump("weekly", weekly(runs))
    dump("flaky_tests", top(test_rows, "rescued", "f"))
    dump("broken_tests", top(test_rows, "never_rescued", "b"))
    dump("rescued_by_team", rescued_by_team(test_rows))
    dump("coverage", coverage(summary))
    dump("fix_top_n", load("fix_top_n"))


main()
