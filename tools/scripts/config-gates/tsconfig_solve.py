#!/usr/bin/env python3
"""Rewrite consumer tsconfigs onto @support/tsconfig presets without changing what they compile.

For each file, every candidate archetype is tried. The residue a candidate needs (the options that
still differ from the snapshot) is written into the file, and the first candidate, by residue
size, whose resolved compilerOptions AND program both equal the snapshot is kept. With
--minimize, each key the preset already provides is then dropped while identity holds.

  tsconfig_solve.py before.json [--minimize] file...

`before.json` is a tsconfig_snapshot.py snapshot of the tree before the rewrite. A file must already
extend a preset (or a sibling config); the solver only picks which one and what stays local.
Solve package configs before the platform or build configs that extend them.

One equivalence is accepted: a config with no `lib` gets TypeScript's default for ESNext,
lib.esnext.full.d.ts. Every preset sets `lib`, so the residue spells the default out and the
program then lacks only that wrapper file.
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

ROOT = os.getcwd()
TSC = os.path.join(ROOT, "node_modules/typescript/bin/tsc6")
NON_DUAL = ["logic", "client", "web", "native", "lib", "lib-react", "lib-node"]
PATH_OPTS = {"outDir", "rootDir", "declarationDir", "tsBuildInfoFile", "baseUrl"}
FALSE_DEFAULT = {"declaration", "declarationMap", "noEmit", "composite", "emitDeclarationOnly"}
DEFAULT_LIB = ["ESNext", "DOM", "DOM.Iterable", "DOM.AsyncIterable", "ScriptHost", "WebWorker.ImportScripts"]
FULL_LIB = "lib.esnext.full.d.ts"
CASE = {
    "es2015": "ES2015", "es2017": "ES2017", "es2018": "ES2018", "es2019": "ES2019", "es2020": "ES2020",
    "es2021": "ES2021", "es2022": "ES2022", "es2023": "ES2023", "esnext": "ESNext", "dom": "DOM",
    "dom.iterable": "DOM.Iterable", "dom.asynciterable": "DOM.AsyncIterable", "commonjs": "CommonJS",
    "nodenext": "NodeNext", "node16": "Node16", "es6": "ES6", "scripthost": "ScriptHost",
    "webworker.importscripts": "WebWorker.ImportScripts",
}
DELETE = object()
MINIMIZE = "--minimize" in sys.argv


def fmt(value, indent=0, in_array=False):
    """JSON in the repository's tsconfig style: short arrays and array items inline."""
    pad = "  " * indent
    if isinstance(value, dict):
        if not value:
            return "{}"
        if in_array:
            one = "{ " + ", ".join(f"{json.dumps(k)}: {fmt(v, 0, True)}" for k, v in value.items()) + " }"
            if len(one) + len(pad) <= 100 and "\n" not in one:
                return one
        body = ",\n".join(f"{pad}  {json.dumps(k)}: {fmt(v, indent + 1)}" for k, v in value.items())
        return "{\n" + body + f"\n{pad}}}"
    if isinstance(value, list):
        if not value:
            return "[]"
        if all(not isinstance(v, (dict, list)) for v in value):
            one = "[" + ", ".join(json.dumps(v) for v in value) + "]"
            if len(one) + len(pad) <= 90:
                return one
        return "[\n" + ",\n".join(f"{pad}  {fmt(v, indent + 1, True)}" for v in value) + f"\n{pad}]"
    return json.dumps(value)


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


def resolve(path, content, program=False):
    """Resolve `content` as if it were `path`, then put the original file back."""
    original = open(path).read()
    directory, name = os.path.split(path)
    cwd = os.path.join(ROOT, directory)
    try:
        open(path, "w").write(content)
        shown = subprocess.run(["node", TSC, "-p", name, "--showConfig"], cwd=cwd, capture_output=True, text=True)
        options = normalize(cwd, json.loads(shown.stdout).get("compilerOptions", {}))
        files = None
        if program:
            listed = subprocess.run(["node", TSC, "-p", name, "--listFilesOnly"], cwd=cwd,
                                    capture_output=True, text=True)
            files = sorted(os.path.relpath(os.path.realpath(line.strip()), ROOT)
                           for line in listed.stdout.splitlines() if line.strip().startswith("/"))
        return options, files
    except (ValueError, OSError):
        return None, None
    finally:
        open(path, "w").write(original)


def delta(want, got):
    out = {}
    for key in set(want) | set(got):
        a, b = want.get(key), got.get(key)
        if key in FALSE_DEFAULT and not a and not b:
            continue
        if key == "lib" and a is None and b is not None and sorted(b) == sorted(x.lower() for x in DEFAULT_LIB):
            continue
        if a != b:
            out[key] = (a, b)
    return out


def same_program(want, got):
    return got is not None and [x for x in want if not x.endswith(FULL_LIB)] == [
        x for x in got if not x.endswith(FULL_LIB)]


def preset_index(extends):
    items = extends if isinstance(extends, list) else [extends]
    for i, item in enumerate(items):
        if isinstance(item, str) and item.startswith("@support/tsconfig/") and item != "@support/tsconfig/lib/build":
            return i
    return None


def with_preset(config, arch):
    config = json.loads(json.dumps(config))
    if arch is None:
        return config
    i = preset_index(config["extends"])
    spec = f"@support/tsconfig/{arch}"
    if isinstance(config["extends"], list):
        config["extends"][i] = spec
    else:
        config["extends"] = spec
    return config


def candidates(config):
    i = preset_index(config.get("extends"))
    if i is None:
        return [None]
    items = config["extends"] if isinstance(config["extends"], list) else [config["extends"]]
    current = items[i].split("/", 2)[2]
    if current == "dual":
        return ["dual"]
    return [current] + [a for a in NON_DUAL if a != current]


def raw(key, value, cfgdir):
    if key == "lib" and isinstance(value, list):
        return [CASE.get(v, v) for v in value]
    if key in ("target", "module", "moduleResolution") and isinstance(value, str):
        return CASE.get(value, value)

    def rel(p):
        r = os.path.relpath(os.path.join(ROOT, p), os.path.join(ROOT, cfgdir))
        return r if r.startswith("..") else "./" + r

    if key in PATH_OPTS and isinstance(value, str):
        return rel(value)
    if key == "paths":
        return {k: [rel(v) for v in vs] for k, vs in value.items()}
    return value


def identical(path, config, want, want_program):
    got, files = resolve(path, fmt(config) + "\n", program=True)
    return got is not None and not delta(want, got) and same_program(want_program, files)


def minimize(path, config, want, want_program):
    for key in list(config.get("compilerOptions", {})):
        trial = json.loads(json.dumps(config))
        del trial["compilerOptions"][key]
        if not trial["compilerOptions"]:
            del trial["compilerOptions"]
        if identical(path, trial, want, want_program):
            config = trial
    for key in ("include", "exclude", "files"):
        if key in config:
            trial = json.loads(json.dumps(config))
            del trial[key]
            if identical(path, trial, want, want_program):
                config = trial
    return config


def solve(path, want, want_program):
    config = json.load(open(path))
    cfgdir = os.path.dirname(path)
    order = candidates(config)
    scored = []
    for arch in order:
        candidate = with_preset(config, arch)
        got, _ = resolve(path, fmt(candidate) + "\n")
        if got is None:
            continue
        own = candidate.get("compilerOptions", {})
        residue, ok = {}, True
        for key, (a, _b) in delta(want, got).items():
            if a is not None:
                residue[key] = raw(key, a, cfgdir)
            elif key == "lib":
                residue[key] = DEFAULT_LIB
            elif key in own:
                residue[key] = DELETE
            elif key in FALSE_DEFAULT:
                residue[key] = False
            else:
                ok = False
                break
        if not ok:
            continue
        options = {k: v for k, v in {**own, **residue}.items() if v is not DELETE}
        if options:
            candidate["compilerOptions"] = options
        else:
            candidate.pop("compilerOptions", None)
        scored.append((len(options), order.index(arch), arch, candidate))
    for _, _, arch, candidate in sorted(scored, key=lambda s: (s[0], s[1])):
        if identical(path, candidate, want, want_program):
            if MINIMIZE:
                candidate = minimize(path, candidate, want, want_program)
            open(path, "w").write(fmt(candidate) + "\n")
            return path, arch, "OK"
    return path, None, "UNSOLVED"


def main():
    with open(sys.argv[1]) as f:
        before = json.load(f)
    files = [a for a in sys.argv[2:] if not a.startswith("--")]
    # A platform or build config resolves through its package config, so package configs go first,
    # and sequentially within a package so a parent is never mid-rewrite while a child resolves.
    tiers = [[f for f in files if os.path.basename(f) == "tsconfig.json" and "/tests/" not in f],
             [f for f in files if os.path.basename(f) != "tsconfig.json" or "/tests/" in f]]
    for tier in tiers:
        with ThreadPoolExecutor(max_workers=os.cpu_count() or 8) as pool:
            for path, arch, status in pool.map(
                    lambda f: solve(f, before[f]["compilerOptions"], before[f]["program"]), tier):
                print(f"{status:9s} {arch}  {path}", flush=True)


if __name__ == "__main__":
    main()
