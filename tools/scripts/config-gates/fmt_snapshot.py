#!/usr/bin/env python3
"""Record the set of files every oxfmt invocation in the repository processes.

A deliberately different style (tabs, width 20) is injected into every oxfmt config for the
duration of the run, so that each file a run processes shows up in `--list-different`. Every
`oxfmt` call in a package script is replayed as written, plus the whole-tree run the git hook
performs. Configs are restored afterwards.

  fmt_snapshot.py snap out.json      run from the repository root, with a clean tree
  fmt_snapshot.py diff before.json after.json
"""
import json
import os
import re
import shlex
import subprocess
import sys

ROOT = os.getcwd()
OXFMT = os.path.join(ROOT, "node_modules/oxfmt/bin/oxfmt")
FORCE = {"useTabs": True, "printWidth": 20, "semi": False, "singleQuote": True}


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def strip_jsonc(text):
    out, i, in_string = [], 0, False
    while i < len(text):
        ch = text[i]
        if in_string:
            out.append(ch)
            if ch == "\\":
                out.append(text[i + 1])
                i += 2
                continue
            in_string = ch != '"'
            i += 1
            continue
        if ch == '"':
            in_string = True
        elif text.startswith("//", i):
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        elif text.startswith("/*", i):
            i = text.index("*/", i) + 2
            continue
        out.append(ch)
        i += 1
    return json.loads(re.sub(r",(\s*[}\]])", r"\1", "".join(out)))


def configs():
    files = git("ls-files").split("\n")
    return [f for f in files if f.endswith(".oxfmtrc.json")
            or (f.endswith("oxfmt.config.mts") and "defineConfig({" in open(f).read())]


def force(path):
    text = open(path).read()
    if path.endswith(".json"):
        config = strip_jsonc(text)
        config.pop("$schema", None)
        config.update(FORCE)
        open(path, "w").write(json.dumps(config, indent=2))
    else:
        text = re.sub(r"\n\s*printWidth: \d+,", "", text)
        inject = ", ".join(f"{k}: {json.dumps(v)}" for k, v in FORCE.items())
        open(path, "w").write(text.replace("defineConfig({", "defineConfig({ " + inject + ",", 1))


def invocations():
    found = []
    for manifest in git("ls-files", "*package.json").split():
        try:
            scripts = json.load(open(manifest)).get("scripts") or {}
        except ValueError:
            continue
        cwd = os.path.dirname(manifest) or "."
        seen = set()
        for name, script in scripts.items():
            for segment in script.split("&&"):
                segment = segment.strip()
                if segment.startswith("pnpm exec oxfmt"):
                    segment = segment[len("pnpm exec "):]
                if not segment.startswith("oxfmt"):
                    continue
                args = tuple(t for t in shlex.split(segment)[1:] if t not in ("--check", "--write"))
                if args not in seen:
                    seen.add(args)
                    found.append((cwd, list(args), f"{manifest}#{name}"))
    found.append((".", ["."], "git hook (whole tree)"))
    return found


def snap(out_path):
    targets = configs()
    if git("status", "--porcelain", "--", *targets).strip():
        sys.exit("refusing to run with modified oxfmt configs: they are rewritten, then restored from git")
    try:
        for path in targets:
            force(path)
        result = {}
        for cwd, args, label in invocations():
            proc = subprocess.run(["node", OXFMT, "--list-different", "--no-error-on-unmatched-pattern", *args],
                                  cwd=os.path.join(ROOT, cwd), capture_output=True, text=True)
            files = sorted(os.path.normpath(os.path.join(cwd, line.strip()))
                           for line in proc.stdout.splitlines() if line.strip())
            result[label] = {"args": args, "files": files}
        with open(out_path, "w") as out:
            json.dump(result, out, indent=1)
        print(f"{len(result)} invocations, {len(targets)} configs")
    finally:
        git("checkout", "--", *targets)


def diff(before_path, after_path):
    with open(before_path) as b, open(after_path) as a:
        before, after = json.load(b), json.load(a)
    differing = 0
    for label in sorted(set(before) | set(after)):
        bf, af = set(before.get(label, {}).get("files", [])), set(after.get(label, {}).get("files", []))
        if label not in before or label not in after:
            print(("+ " if label not in before else "- ") + label)
            differing += 1
            continue
        if bf != af:
            differing += 1
            print(f"~ {label}: {len(bf)} -> {len(af)}")
            for f in sorted(bf - af)[:8]:
                print(f"    no longer formatted  {f}")
            for f in sorted(af - bf)[:8]:
                print(f"    newly formatted      {f}")
    print(f"\n{differing} of {len(set(before) | set(after))} invocations differ")


if __name__ == "__main__":
    if sys.argv[1] == "snap":
        snap(sys.argv[2])
    else:
        diff(sys.argv[2], sys.argv[3])
