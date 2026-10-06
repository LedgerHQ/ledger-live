# Config migration gates

Checks that prove a tooling-config refactor changes nothing it should not. Each one snapshots the
tree, so the same command runs on the base and on the branch, and `diff` compares the two. Run them
from the repository root after `pnpm i`. Python 3, standard library only.

| Script | Proves | Snapshot |
| --- | --- | --- |
| `tsconfig_snapshot.py` | Every tsconfig resolves to the same compiler options and the same program | `tsc --showConfig` and `--listFilesOnly` per config |
| `lint_snapshot.py` | Every package's lint run gains or loses exactly the diagnostics listed | Each `lint` script replayed with `-f json`; `--all` adds what the editor sees |
| `fmt_snapshot.py` | Every oxfmt invocation formats the same set of files | Each script's `oxfmt` call under a forced style, with `--list-different` |
| `jest_snapshot.py` | Every jest preset consumer passes and fails the same test files | Each consumer's suite with `--ci --forceExit --json` |

```sh
python3 tools/scripts/config-gates/tsconfig_snapshot.py snap /tmp/after.json
python3 tools/scripts/config-gates/tsconfig_snapshot.py diff /tmp/before.json /tmp/after.json
```

`tsconfig_solve.py` is the migration tool rather than a gate: given a snapshot of the tree before a
rewrite, it picks each config's `@support/tsconfig` preset and the residue that keeps its program
identical.

The base snapshot comes from a checkout of the base commit with its own install; swapping config
files inside one checkout does not reproduce the base faithfully.
