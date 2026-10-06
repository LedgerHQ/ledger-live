#!/usr/bin/env python3
"""Run every workspace package's `lint` script and record each diagnostic it produces.

Each package's `lint` script is replayed as `oxlint <args> -f json` in the package directory, so the
config oxlint finds is the one CI and the editor find. With --all, packages that have a `src/` but
no lint script are linted too, as `oxlint src`: that is what the editor shows for them.

  lint_snapshot.py snap out.json [--all]      run from the repository root
  lint_snapshot.py diff before.json after.json
"""
import collections
import json
import os
import shlex
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.getcwd()
OXLINT = os.path.join(ROOT, "node_modules/oxlint/bin/oxlint")


def manifests():
    out = subprocess.run(["git", "ls-files", "*package.json"], capture_output=True, text=True).stdout.split()
    return [p for p in out if "/node_modules/" not in p and p != "package.json"]


def lint_args(script):
    tokens = shlex.split(script.split("&&")[0].strip())
    if "oxlint" not in tokens:
        return None
    return [t for t in tokens[tokens.index("oxlint") + 1:] if t not in ("--fix", "--quiet")]


def run(manifest, all_packages):
    directory = os.path.dirname(manifest)
    try:
        with open(manifest) as f:
            scripts = json.load(f).get("scripts") or {}
    except ValueError:
        return directory, None
    script = scripts.get("lint")
    args = lint_args(script) if script else None
    if args is None:
        if not all_packages or not os.path.isdir(os.path.join(directory, "src")):
            return directory, None
        args, script = ["src"], "(none) oxlint src"
    proc = subprocess.run(["node", OXLINT, *args, "-f", "json"], cwd=os.path.join(ROOT, directory),
                          capture_output=True, text=True)
    try:
        report = json.loads(proc.stdout)
    except ValueError:
        return directory, {"script": script, "error": (proc.stderr or proc.stdout)[:300]}
    diagnostics = sorted(
        f"{d.get('severity')} {d.get('code')} {d.get('filename')}:"
        f"{(d.get('labels') or [{}])[0].get('span', {}).get('line', '?')}"
        for d in report.get("diagnostics", [])
    )
    return directory, {"script": script, "exit": proc.returncode, "files": report.get("number_of_files"),
                       "rules": report.get("number_of_rules"), "diagnostics": diagnostics}


def snap(out_path, all_packages):
    with ThreadPoolExecutor(max_workers=max(2, (os.cpu_count() or 8) // 2)) as pool:
        results = {d: r for d, r in pool.map(lambda m: run(m, all_packages), manifests()) if r is not None}
    with open(out_path, "w") as out:
        json.dump(results, out, indent=1, sort_keys=True)
    failed = [k for k, v in results.items() if "error" in v]
    nonzero = [k for k, v in results.items() if v.get("exit")]
    print(f"{len(results)} packages, {len(nonzero)} non-zero exit, {len(failed)} failed to run")
    for key in failed[:10]:
        print("  FAIL", key, results[key]["error"][:200].replace("\n", " "))


def scripted(entry):
    return not entry.get("script", "").startswith("(none)")


def diff(before_path, after_path):
    with open(before_path) as b, open(after_path) as a:
        before, after = json.load(b), json.load(a)
    totals = collections.Counter()
    for key in sorted(set(before) | set(after)):
        b, a = before.get(key), after.get(key)
        if b is None:
            print(f"+ {key}  newly linted, rules={a.get('rules')} exit={a.get('exit')}")
            continue
        if a is None:
            print(f"- {key}  no longer linted")
            continue
        if "error" in b or "error" in a:
            if b.get("error") != a.get("error"):
                print(f"! {key}  before={b.get('error', '')[:80]!r} after={a.get('error', '')[:80]!r}")
            continue
        changes = []
        if b["rules"] != a["rules"]:
            changes.append(f"rules {b['rules']} -> {a['rules']}")
        if b["exit"] != a["exit"]:
            changes.append(f"exit {b['exit']} -> {a['exit']}")
        gone = collections.Counter(b["diagnostics"]) - collections.Counter(a["diagnostics"])
        new = collections.Counter(a["diagnostics"]) - collections.Counter(b["diagnostics"])
        by_rule = collections.defaultdict(lambda: [0, 0])
        for item in gone.elements():
            by_rule[" ".join(item.split(" ")[:2])][0] += 1
        for item in new.elements():
            by_rule[" ".join(item.split(" ")[:2])][1] += 1
        for rule, (minus, plus) in sorted(by_rule.items()):
            changes.append(f"{rule}: -{minus} +{plus}")
            severity = rule.split(" ")[0]
            bucket = "ci" if scripted(a) else "editor"
            totals[(bucket, severity, "-")] += minus
            totals[(bucket, severity, "+")] += plus
        for item in new.elements():
            if item.startswith("error"):
                changes.append(f"   NEW ERROR {item}")
        if b.get("script") != a.get("script"):
            changes.append(f"script {b.get('script')!r} -> {a.get('script')!r}")
        if changes:
            print(f"~ {key}\n    " + "\n    ".join(changes))
    print("\nTOTALS (bucket, severity, direction):")
    for k in sorted(totals):
        print("  ", k, totals[k])


if __name__ == "__main__":
    if sys.argv[1] == "snap":
        snap(sys.argv[2], "--all" in sys.argv)
    else:
        diff(sys.argv[2], sys.argv[3])
