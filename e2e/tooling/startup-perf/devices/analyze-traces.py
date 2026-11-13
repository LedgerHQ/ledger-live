#!/usr/bin/env python3
"""Where each traced Android launch (run.ts --trace) spent its time, from its Perfetto trace.

For the app's UI, JS and render threads and its other threads: the time running, waiting for a CPU
(runnable), sleeping and blocked, between the start of the process and the readiness gate opening
("WaitForAppReady done"), and between the gate and "App started"; plus how busy the emulator's CPUs
were and its busiest processes. A build without the gate's events gets one window, up to "App
started". The app's startup events count from its start request, which the trace shows as the
"Start proc" slice of system_server; the process fork is the fallback.

Writes one JSON line per launch and prints a table. Needs the perfetto package (trace_processor).

    analyze-traces.py --samples samples.jsonl --traces traces/ --out traces-summary.jsonl
"""
import argparse
import json
import pathlib
import re
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
# Builds 4.26-4.27 count their events from the first JS import, which the trace cannot place.
JS_START_BASE_MAX_MS = 50
GROUPS = ("ui", "js", "render", "other")
STATES = ("running", "runnable", "sleeping", "blocked")
MS = 1_000_000


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


def window(tp, upid, pid, start, end, trace_end):
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
        "threads": {g: {s: round(v) for s, v in states[g].items()} for g in GROUPS},
        "top": top,
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
    gate, last_condition = gate_of(events)
    at = lambda ms: origin + int(ms * MS)  # noqa: E731
    result = {"origin": origin_source, "gateMs": gate, "lastCondition": last_condition, "appStartedMs": started}
    if gate is None:
        result["toAppStarted"] = window(tp, process.upid, pid, origin, at(started), trace_end)
        return result
    if gate > started:
        return {"error": f"the gate opened at {gate} ms, after App started at {started} ms"}
    result["beforeGate"] = window(tp, process.upid, pid, origin, at(gate), trace_end)
    result["afterGate"] = window(tp, process.upid, pid, at(gate), at(started), trace_end)
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
        t["render"]["running"], t["other"]["running"], shown["cpuBusy"], "cut" if shown["truncated"] else "",
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
          " | render run | other run | cpu busy | trace cut")
    analysed = 0
    with open(args.out, "w") as out:
        for sample in traced:
            name = f"{sample['scenario']}-p{sample['phase']}-r{sample['round']}-{sample['side']}"
            tp = None
            try:
                tp = TraceProcessor(trace=str(pathlib.Path(args.traces) / sample["trace"]))
                result = launch_of(tp, sample)
            except Exception as error:  # one unreadable trace leaves out its launch only
                result = {"error": str(error)[:300]}
            finally:
                if tp is not None:
                    tp.close()
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
