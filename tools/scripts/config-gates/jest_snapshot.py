#!/usr/bin/env python3
"""Run the jest suite of every package that uses a @support/jest preset and record each test file.

A package is in scope when its package.json depends on @support/jest or one of the former
@support/jest-* presets, so the same command selects the same consumers on a base checkout and on
a branch. Suites run with --ci (no snapshot writes) and --forceExit (the features-flow web setup
leaves a MessageChannel port open, which keeps an in-band run alive), one package at a time.

  jest_snapshot.py snap out.json [package-dir...]   run from the repository root
  jest_snapshot.py diff before.json after.json
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.getcwd()
PRESET = re.compile(r'"@support/jest(-devtools|-features-flow|-shared)?"\s*:')


def consumers():
    out = subprocess.run(["git", "ls-files", "*package.json"], capture_output=True, text=True).stdout.split()
    return sorted(os.path.dirname(p) for p in out
                  if not p.startswith("support/") and PRESET.search(open(p).read()))


def jest_bin(directory):
    local = os.path.join(ROOT, directory, "node_modules/jest/bin/jest.js")
    return local if os.path.exists(local) else os.path.join(ROOT, "node_modules/.pnpm/node_modules/jest/bin/jest.js")


def run(directory):
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as report:
        out_file = report.name
    env = {**os.environ, "TZ": "America/New_York", "CI": "true"}
    proc = subprocess.run(
        ["node", jest_bin(directory), "--ci", "--forceExit", "--silent", "--json", f"--outputFile={out_file}"],
        cwd=os.path.join(ROOT, directory), capture_output=True, text=True, env=env, timeout=1800)
    try:
        with open(out_file) as f:
            data = json.load(f)
    except (ValueError, OSError):
        return {"exit": proc.returncode, "error": (proc.stderr or proc.stdout)[-600:]}
    finally:
        if os.path.exists(out_file):
            os.unlink(out_file)
    files = {}
    for result in data.get("testResults", []):
        name = os.path.relpath(result["name"], os.path.join(ROOT, directory))
        files[name] = {
            "status": result.get("status"),
            "passed": sum(1 for a in result.get("assertionResults", []) if a.get("status") == "passed"),
            "failed": sum(1 for a in result.get("assertionResults", []) if a.get("status") == "failed"),
            "message": (result.get("message") or "")[:300],
        }
    return {"exit": proc.returncode, "suites": data.get("numTotalTestSuites"),
            "tests": data.get("numTotalTests"), "failedTests": data.get("numFailedTests"), "files": files}


def snap(out_path, only):
    targets = only or consumers()
    results = {}
    for i, directory in enumerate(targets, 1):
        results[directory] = run(directory)
        r = results[directory]
        summary = r.get("error", "")[:120].replace("\n", " ") or \
            f"suites={r['suites']} tests={r['tests']} failed={r['failedTests']}"
        print(f"[{i}/{len(targets)}] {directory}: exit={r['exit']} {summary}", flush=True)
        with open(out_path, "w") as out:
            json.dump(results, out, indent=1, sort_keys=True)


def diff(before_path, after_path):
    with open(before_path) as b, open(after_path) as a:
        before, after = json.load(b), json.load(a)
    regressions, fixes, other = [], [], []
    for package in sorted(set(before) | set(after)):
        b, a = before.get(package), after.get(package)
        if b is None or a is None:
            other.append(f"{'+' if b is None else '-'} {package}")
            continue
        if "error" in b or "error" in a:
            if ("error" in b) != ("error" in a):
                other.append(f"! {package} run error before={'error' in b} after={'error' in a}")
            continue
        for name in sorted(set(b["files"]) | set(a["files"])):
            fb, fa = b["files"].get(name), a["files"].get(name)
            if fb is None or fa is None:
                other.append(f"{'+' if fb is None else '-'} {package}/{name}")
            elif fb["status"] != fa["status"] or fb["failed"] != fa["failed"] or fb["passed"] != fa["passed"]:
                line = f"{package}/{name}: {fb['status']} {fb['passed']}/{fb['failed']} -> {fa['status']} {fa['passed']}/{fa['failed']}"
                (regressions if fa["failed"] > fb["failed"] or fa["status"] == "failed" and fb["status"] == "passed"
                 else fixes).append(line)
    print(f"{len(regressions)} regressions")
    for line in regressions:
        print("  REGRESSION", line)
    print(f"{len(fixes)} improvements")
    for line in fixes:
        print("  better", line)
    print(f"{len(other)} structural differences")
    for line in other:
        print("  ", line)


if __name__ == "__main__":
    if sys.argv[1] == "snap":
        snap(sys.argv[2], sys.argv[3:])
    else:
        diff(sys.argv[2], sys.argv[3])
