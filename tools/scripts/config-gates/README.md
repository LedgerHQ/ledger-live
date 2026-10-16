# Config migration gates

Migration tooling for the support/ tool presets. Lives on this branch only, never merged; fetch with
`git checkout origin/support/config-gates -- tools/scripts/config-gates` (do not commit them),
deleted once the migration is done.

Checks that prove a tooling-config refactor changes nothing it should not. Each one snapshots the
tree, so the same command runs on the base and on the branch, and `diff` compares the two. Run them
from the repository root of an installed checkout. Where a tool can report what it resolves, the
gate asks it, through the checkout's own copy of the tool.

| Script | Proves | Snapshot |
| --- | --- | --- |
| `tsconfig-snapshot.mjs` | Every tsconfig resolves to the same compiler options and the same program | Options and references from the TypeScript compiler API, as `--showConfig` prints them; program from `tsc --listFilesOnly` |
| `lint-snapshot.mjs` | Every package's lint config and diagnostics stay the same, or change exactly as listed, and no package loses or downgrades a rule | Each `lint` script replayed with `--print-config` and `-f json`; `--all` adds what the editor sees |
| `fmt-snapshot.mjs` | Every oxfmt invocation formats the same set of files | Each script's `oxfmt` call under a forced style, with `--list-different` |
| `jest-snapshot.mjs` | Every jest preset consumer resolves the same config and test files, and with `--run` passes and fails the same tests | `--showConfig` and `--listTests`; `--run` adds `--ci --forceExit --json` |

## Running a gate

Snapshot the base and the branch on two checkouts installed the same way. Swapping config files
inside one checkout does not reproduce the base, and two installs made differently (one with
scripts, one without) differ in generated and linked files, which shows up as phantom program
changes. A checkout you have built in also carries `lib/` outputs the other side lacks, so take
the branch side from a fresh worktree too. Never compare a branch with an earlier state of itself:
the base is the commit the branch merges into.

```sh
GATES="$PWD/tools/scripts/config-gates"
git worktree add --detach ../base origin/develop
git worktree add --detach ../branch HEAD
(cd ../base && pnpm i --frozen-lockfile --ignore-scripts)
(cd ../branch && pnpm i --frozen-lockfile --ignore-scripts)

(cd ../base && node "$GATES/tsconfig-snapshot.mjs" snap /tmp/before.json)
(cd ../branch && node "$GATES/tsconfig-snapshot.mjs" snap /tmp/after.json)
node "$GATES/tsconfig-snapshot.mjs" diff /tmp/before.json /tmp/after.json
```

The other gates take the same `snap` and `diff` commands. Running the branch's copy of a script on
the base keeps both snapshots comparable while the gates themselves change.

- `tsconfig-snapshot.mjs` records the program, not only the options: a preset using `${configDir}`
  can resolve to the same options and still select other files. The options come from the function
  `tsc --showConfig` prints with, which TypeScript exports without declaring it: if an upgrade
  removes it, the gate fails instead of recording something else.
- `fmt-snapshot.mjs` rewrites every oxfmt config for the duration of the run and restores it from git,
  so it refuses to run while one of them has uncommitted changes.
- `lint-snapshot.mjs` stores oxlint's own message when a run fails, without its run time, so only a
  package whose failure changes shows up as `!` in the report. Its diff ends with the rules each
  package loses or downgrades (error to warn, warn to off), compared on the printed configs: code
  that violates no rule today lints the same under a weaker config, so the diagnostics alone cannot
  show the loss. `--print-config` leaves out `overrides` and the rule flags of the command line
  (`-A`, `-W`, `-D`), so a rule an override or a flag keeps can be listed as weakened, and one they
  weaken is not listed. The diff names the packages with rule flags; check those, and the packages
  an override covers, with a probe file.
- `jest-snapshot.mjs --run` runs one consumer at a time, which is slow on the whole tree. Pass
  package directories after the output path to snapshot a subset. The config and test-file
  snapshot without `--run` takes seconds and is the first check to run.

Every gate reports differences, not a verdict. A migration pull request lists each remaining
difference and explains it.
