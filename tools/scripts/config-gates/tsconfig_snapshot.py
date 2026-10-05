#!/usr/bin/env python3
"""Resolve every tsconfig in the repository and record what TypeScript would compile.

For each tracked tsconfig*.json: the resolved compilerOptions (`tsc --showConfig`, path options
made repo-relative), the resolved references, and the full program file list
(`tsc --listFilesOnly`). Two configs with the same options and the same program compile
identically, so diffing two snapshots proves a config refactor changes nothing.

  tsconfig_snapshot.py snap out.json          run from the repository root
  tsconfig_snapshot.py diff before.json after.json
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.getcwd()
TSC = os.path.join(ROOT, "node_modules/typescript/bin/tsc6")
PATH_OPTS = {"outDir", "rootDir", "declarationDir", "tsBuildInfoFile", "baseUrl"}


def tracked():
    out = subprocess.run(["git", "ls-files", "-co", "--exclude-standard"], capture_output=True, text=True).stdout
    return sorted(f for f in out.split("\n") if re.search(r"(^|/)tsconfig[^/]*\.json$", f) and os.path.exists(f))


def norm(cfgdir, value):
    path = value if os.path.isabs(value) else os.path.normpath(os.path.join(cfgdir, value))
    return os.path.relpath(path, ROOT)


def normalize(cfgdir, options):
    out = {}
    for key, value in options.items():
        if key in PATH_OPTS and isinstance(value, str):
            value = norm(cfgdir, value)
        elif key in ("rootDirs", "typeRoots"):
            value = [norm(cfgdir, v) for v in value]
        elif key == "paths":
            value = {k: [norm(cfgdir, v) for v in vs] for k, vs in value.items()}
        out[key] = value
    return out


def resolve(path):
    directory, name = os.path.split(path)
    cwd = os.path.join(ROOT, directory or ".")
    shown = subprocess.run(["node", TSC, "-p", name, "--showConfig"], cwd=cwd, capture_output=True, text=True)
    try:
        config = json.loads(shown.stdout)
    except ValueError:
        return path, {"error": (shown.stdout or shown.stderr)[:400]}
    listed = subprocess.run(["node", TSC, "-p", name, "--listFilesOnly"], cwd=cwd, capture_output=True, text=True)
    program = sorted(
        os.path.relpath(os.path.realpath(line.strip()), ROOT)
        for line in listed.stdout.splitlines()
        if line.strip().startswith("/")
    )
    return path, {
        "compilerOptions": normalize(cwd, config.get("compilerOptions", {})),
        "references": [norm(cwd, r.get("path")) for r in config.get("references", [])],
        "program": program,
    }


def snap(out_path):
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 8) as pool:
        data = dict(pool.map(resolve, tracked()))
    with open(out_path, "w") as out:
        json.dump(data, out, indent=1, sort_keys=True)
    failed = [k for k, v in data.items() if "error" in v]
    print(f"{len(data)} configs resolved, {len(failed)} failed")
    for key in failed[:20]:
        print("  FAIL", key, data[key]["error"][:160].replace("\n", " "))


def diff(before_path, after_path):
    with open(before_path) as b, open(after_path) as a:
        before, after = json.load(b), json.load(a)
    changed = 0
    for key in sorted(set(before) | set(after)):
        b, a = before.get(key), after.get(key)
        if b == a:
            continue
        changed += 1
        if b is None or a is None:
            print("+" if b is None else "-", key)
            continue
        print("~", key)
        for top in sorted(set(b) | set(a)):
            bv, av = b.get(top), a.get(top)
            if bv == av:
                continue
            if top == "compilerOptions":
                for option in sorted(set(bv or {}) | set(av or {})):
                    if (bv or {}).get(option) != (av or {}).get(option):
                        print(f"    {option}: {json.dumps((bv or {}).get(option))} -> {json.dumps((av or {}).get(option))}")
            elif top == "program" and bv is not None and av is not None:
                gone, new = sorted(set(bv) - set(av)), sorted(set(av) - set(bv))
                print(f"    program: {len(bv)} -> {len(av)} files, -{len(gone)} +{len(new)}  e.g. -{gone[:3]} +{new[:3]}")
            else:
                print(f"    {top}: {json.dumps(bv)[:150]} -> {json.dumps(av)[:150]}")
    print(f"\n{changed} configs differ of {len(set(before) | set(after))}")


if __name__ == "__main__":
    if sys.argv[1] == "snap":
        snap(sys.argv[2])
    else:
        diff(sys.argv[2], sys.argv[3])
