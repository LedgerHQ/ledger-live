#!/usr/bin/env python3
"""Where each traced Android launch (run.ts --trace) spent its time, from its Perfetto trace.

For the app's UI, JS and render threads and its other threads: the time running, waiting for a CPU
(runnable), sleeping and blocked, between the start of the process and the readiness gate opening
("WaitForAppReady done"), between the gate and "App started", and from "Splash screen faded" to
"App started"; plus how busy the emulator's CPUs were, the time the host took them away (steal,
from /proc/stat every 100 ms, when the emulator's Perfetto records it), its busiest processes, the
app's UI thread and RenderThread slices (frames, layout passes, draws) and which threads woke the UI
thread while it slept. A build without the gate's events gets one
window, up to "App started". The app's startup events count from its start request, which the
trace shows as the "Start proc" slice of system_server; the process fork is the fallback.

Writes one JSON line per launch and prints a table. Needs the perfetto package (trace_processor).

    analyze-traces.py --samples samples.jsonl --traces traces/ --out traces-summary.jsonl
"""
import argparse
import json
import os
import pathlib
import re
import signal
import subprocess
import sys

from perfetto.trace_processor import TraceProcessor

APP = "com.ledger.live"
GATE_OPEN = "WaitForAppReady done"
GATE_CONDITIONS = {
    "currencies": "WaitForAppReady currencies ready",
    "remote flags": "WaitForAppReady remote flags ready",
    "geo-block check": "WaitForAppReady availability checked",
}
GATE_TIMED_OUT = "WaitForAppReady timed out"
APP_STARTED = "App started"
# "App started" (the root view's first layout) can land well after the splash fade on lavapipe.
SPLASH_FADED = "Splash screen faded"
# Builds 4.26-4.27 count their events from the first JS import, which the trace cannot place.
JS_START_BASE_MAX_MS = 50
GROUPS = ("ui", "js", "render", "other")
STATES = ("running", "runnable", "sleeping", "blocked")
MS = 1_000_000
SLICES = 12
WAKERS = 5
# A trace takes a few seconds; one that hung a CI job for an hour is left out after this.
TRACE_TIMEOUT_S = 120


class TraceTimeout(Exception):
    pass


def on_alarm(_signum, _frame):
    # A trace still loading has no TraceProcessor to close yet: stop this script's trace_processor.
    subprocess.run(["pkill", "-P", str(os.getpid()), "-f", "trace_processor"], check=False)
    raise TraceTimeout(f"no result after {TRACE_TIMEOUT_S} s")


signal.signal(signal.SIGALRM, on_alarm)


def group_of(tid, pid, name):
    name = name or ""
    if tid == pid:
        return "ui"
    if re.search(r"mqt.*js", name):
        return "js"
    if name == "RenderThread" or name.startswith("hwuiTask"):
        return "render"
    return "other"


def state_of(state):
    if state == "Running":
        return "running"
    if state in ("R", "R+"):
        return "runnable"
    if state == "S":
        return "sleeping"
    return "blocked"


def overlap(table, start, end):
    """SQL for the part of each row of `table` inside [start, end]; an open row runs to `end`."""
    row_end = f"case when {table}.dur < 0 then {end} else {table}.ts + {table}.dur end"
    return f"max(0, min({row_end}, {end}) - max({table}.ts, {start}))"


def inside(table, start, end):
    return f"{table}.ts < {end} and ({table}.dur < 0 or {table}.ts + {table}.dur > {start})"


def first(tp, sql):
    rows = list(tp.query(sql))
    return rows[0] if rows else None


def value_at(samples, ts):
    """A cumulative counter at `ts`, interpolated between its samples; None outside them."""
    for (t0, v0), (t1, v1) in zip(samples, samples[1:]):
        if t0 <= ts <= t1:
            return v0 if t1 == t0 else v0 + (v1 - v0) * (ts - t0) / (t1 - t0)
    return None


def counted_between(tracks, start, end):
    """Sum over CPUs of a cumulative counter's growth in [start, end], in ms; None without samples."""
    total, counted = 0.0, False
    for samples in tracks.values():
        a, b = value_at(samples, start), value_at(samples, end)
        if a is not None and b is not None:
            total += b - a
            counted = True
    return round(total / MS) if counted else None


def steal_tracks(tp):
    """Per CPU, the samples (ts, ns) of the guest's cumulative steal time; none when not recorded.

    The emulator's traced_probes leaves steal_ns out of its /proc/stat samples, which trace_processor
    reads as 0: a counter counted since boot that never left 0 was not recorded.
    """
    tracks = {}
    for row in tp.query("""select counter.track_id as track, counter.ts as ts, counter.value as value
        from counter join counter_track on counter.track_id = counter_track.id
        where counter_track.name like '%steal%' order by counter.track_id, counter.ts"""):
        tracks.setdefault(row.track, []).append((row.ts, row.value))
    if not any(value for samples in tracks.values() for _, value in samples):
        return {}
    return tracks


def short_slice(name):
    """A slice name with its numbers as #, so frames group: "Choreographer#doFrame #", "Drawing # # # #"."""
    return re.sub(r"\s+", " ", re.sub(r"\d+(\.\d+)?", "#", name or "?")).strip()


def app_slices(tp, upid, pid, start, end):
    """The app's UI thread and RenderThread slices in [start, end], top two levels: name, count, ms."""
    totals = {}
    for row in tp.query(f"""
        select thread.tid as tid, slice.depth as depth, slice.name as name, count(*) as n,
          sum({overlap('slice', start, end)}) as ns
        from slice join thread_track on slice.track_id = thread_track.id join thread using(utid)
        where thread.upid = {upid} and (thread.tid = {pid} or thread.name = 'RenderThread')
          and slice.depth <= 1 and {inside('slice', start, end)}
        group by thread.tid, slice.depth, slice.name"""):
        key = f"{'ui' if row.tid == pid else 'render'}{' >' if row.depth else ''} {short_slice(row.name)}"
        n, ns = totals.get(key, (0, 0))
        totals[key] = (n + row.n, ns + (row.ns or 0))
    busiest = sorted(totals.items(), key=lambda item: -item[1][1])[:SLICES]
    return [[key, n, round(ns / MS)] for key, (n, ns) in busiest]


def ui_wakers(tp, upid, pid, start, end):
    """While the UI thread slept in [start, end]: which threads woke it, how often, and the ms slept."""
    rows = tp.query(f"""
        select coalesce(waker_process.name, '?') as process, coalesce(waker.name, '?') as thread,
          count(*) as n, sum({overlap('slept', start, end)}) as ns
        from thread_state as slept join thread as ui on slept.utid = ui.utid
          left join thread_state as woken on woken.utid = slept.utid and woken.ts = slept.ts + slept.dur
          left join thread as waker on coalesce(woken.waker_utid, slept.waker_utid) = waker.utid
          left join process as waker_process on waker.upid = waker_process.upid
        where ui.upid = {upid} and ui.tid = {pid} and slept.state = 'S' and {inside('slept', start, end)}
        group by 1, 2 order by ns desc limit {WAKERS}""")
    return [[f"{row.process.split('/')[-1]}/{row.thread}", row.n, round((row.ns or 0) / MS)] for row in rows]


def guarded(compute, *args):
    try:
        return compute(*args)
    except Exception as error:  # a query this trace_processor cannot run leaves out its field only
        return {"error": str(error)[:200]}


def window(tp, upid, pid, start, end, trace_end, steal):
    truncated = end > trace_end
    end = min(end, trace_end)
    if end <= start:
        return None
    states = {g: dict.fromkeys(STATES, 0.0) for g in GROUPS}
    for row in tp.query(f"""
        select thread.tid as tid, thread.name as name, thread_state.state as state,
          sum({overlap('thread_state', start, end)}) as ns
        from thread_state join thread using(utid)
        where thread.upid = {upid} and {inside('thread_state', start, end)}
        group by thread.tid, thread.name, thread_state.state"""):
        states[group_of(row.tid, pid, row.name)][state_of(row.state)] += (row.ns or 0) / MS
    cpus = first(tp, "select count(distinct cpu) as n from sched").n or 1
    busy = first(tp, f"""select sum({overlap('sched', start, end)}) as ns from sched
        where sched.utid != 0 and {inside('sched', start, end)}""")
    top = [
        [row.name, round((row.ns or 0) / MS)]
        for row in tp.query(f"""
            select coalesce(process.name, thread.name, 'unknown') as name,
              sum({overlap('sched', start, end)}) as ns
            from sched join thread using(utid) left join process using(upid)
            where sched.utid != 0 and {inside('sched', start, end)}
            group by 1 order by ns desc limit 6""")
    ]
    wall = (end - start) / MS
    return {
        "wallMs": round(wall),
        "truncated": truncated,
        "cpuBusy": round(((busy.ns or 0) / MS) / (wall * cpus), 2),
        "stealMs": counted_between(steal, start, end),
        "threads": {g: {s: round(v) for s, v in states[g].items()} for g in GROUPS},
        "top": top,
        "slices": guarded(app_slices, tp, upid, pid, start, end),
        "uiWokenBy": guarded(ui_wakers, tp, upid, pid, start, end),
    }


def origin_of(tp, upid):
    """The app's start request ("Start proc" slice), else its fork, else its first thread state."""
    process = first(tp, f"select start_ts from process where upid = {upid}")
    fork = process.start_ts if process else None
    request = first(tp, f"""select max(ts) as ts from slice where name = 'Start proc: {APP}'
        {f'and ts <= {fork}' if fork is not None else ''}""")
    if request and request.ts is not None:
        return request.ts, "start request"
    if fork is not None:
        return fork, "fork"
    state = first(tp, f"""select min(thread_state.ts) as ts from thread_state join thread using(utid)
        where thread.upid = {upid}""")
    return (state.ts, "first thread state") if state and state.ts is not None else (None, None)


def gate_of(events):
    """When the gate opened, and which of its conditions came last (or that it timed out)."""
    if GATE_OPEN not in events:
        return None, None
    if GATE_TIMED_OUT in events:
        return events[GATE_OPEN], "timed out"
    met = {name: events[event] for name, event in GATE_CONDITIONS.items() if event in events}
    return events[GATE_OPEN], max(met, key=met.get) if met else None


def launch_of(tp, sample):
    pid = int(sample["pid"])
    process = first(tp, f"select upid from process where pid = {pid} order by start_ts desc")
    if process is None:
        return {"error": f"no process with pid {pid} in the trace"}
    events = {name: e["time"] for name, e in (sample.get("events") or {}).items()}
    if events.get("Before js imports", JS_START_BASE_MAX_MS) < JS_START_BASE_MAX_MS:
        return {"error": "the events count from the first JS import, not from the process start"}
    started = events.get(APP_STARTED)
    if started is None:
        return {"error": "the launch has no App started event"}
    origin, origin_source = origin_of(tp, process.upid)
    if origin is None:
        return {"error": "the app process has no start in the trace"}
    trace_end = first(tp, "select end_ts from trace_bounds").end_ts
    steal = steal_tracks(tp)
    gate, last_condition = gate_of(events)
    at = lambda ms: origin + int(ms * MS)  # noqa: E731
    result = {"origin": origin_source, "gateMs": gate, "lastCondition": last_condition, "appStartedMs": started}
    if gate is None:
        result["toAppStarted"] = window(tp, process.upid, pid, origin, at(started), trace_end, steal)
        return result
    if gate > started:
        return {"error": f"the gate opened at {gate} ms, after App started at {started} ms"}
    result["beforeGate"] = window(tp, process.upid, pid, origin, at(gate), trace_end, steal)
    result["afterGate"] = window(tp, process.upid, pid, at(gate), at(started), trace_end, steal)
    splash = events.get(SPLASH_FADED)
    if splash is not None and gate <= splash < started:
        result["afterSplash"] = window(tp, process.upid, pid, at(splash), at(started), trace_end, steal)
    return result


def row_of(name, sample, result):
    if "error" in result:
        return f"{name} | {result['error']}"
    shown = result.get("afterGate") or result.get("toAppStarted")
    if shown is None:
        return f"{name} | empty window"
    t = shown["threads"]
    return " | ".join(str(x) for x in [
        name, sample.get("appStartupTime"), result["gateMs"], result["lastCondition"], shown["wallMs"],
        f"{t['ui']['running']}/{t['ui']['runnable']}", f"{t['js']['running']}/{t['js']['runnable']}",
        t["render"]["running"], t["other"]["running"], shown["cpuBusy"], shown["stealMs"],
        "cut" if shown["truncated"] else "",
    ])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", required=True)
    parser.add_argument("--traces", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    samples = [json.loads(line) for line in pathlib.Path(args.samples).read_text().splitlines() if line.strip()]
    traced = [s for s in samples if s.get("trace") and s.get("ok") and s.get("pid")]
    print(f"{len(traced)} traced launches of {len(samples)}")
    print("launch | startup | gate | last condition | after-gate wall | ui run/runnable | js run/runnable"
          " | render run | other run | cpu busy | steal ms | trace cut")
    analysed = 0
    with open(args.out, "w") as out:
        for sample in traced:
            name = f"{sample['scenario']}-p{sample['phase']}-r{sample['round']}-{sample['side']}"
            tp = None
            signal.alarm(TRACE_TIMEOUT_S)
            try:
                tp = TraceProcessor(trace=str(pathlib.Path(args.traces) / sample["trace"]))
                result = launch_of(tp, sample)
            except Exception as error:  # one unreadable or stuck trace leaves out its launch only
                result = {"error": str(error)[:300]}
            finally:
                signal.alarm(0)
                if tp is not None:
                    try:
                        tp.close()
                    except Exception:  # already stopped by on_alarm
                        pass
            analysed += "error" not in result
            out.write(json.dumps({"name": name, "side": sample["side"], "phase": sample["phase"],
                                  "round": sample["round"], "device": sample["device"],
                                  "appStartupTime": sample.get("appStartupTime"), **result}) + "\n")
            print(row_of(name, sample, result))
    print(f"{analysed} of {len(traced)} traced launches analysed")
    if traced and not analysed:
        sys.exit(1)


if __name__ == "__main__":
    main()
