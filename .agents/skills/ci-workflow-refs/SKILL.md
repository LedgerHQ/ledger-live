---
name: ci-workflow-refs
description: Root workflows run at the triggering commit but call reusable workflows and composite actions pinned `@develop`, so on release/hotfix/main the child YAML is newer than the code it checks out. Read before changing any reusable workflow (`*-reusable.yml`, `workflow_call`) or composite action under `tools/actions/`, or before adding a CI step that runs a pnpm script, Nx target or repo file. Also read before writing how a CI change was tested, or before saying a CI change cannot be tested before merge.
---

# CI Workflow Refs (split brain)

## How it runs

- **Root workflows** (`build-and-test-push.yml`, `build-and-test-pr.yml`, `merge-queue.yml`, `release-*.yml`) run from the triggering commit's YAML.
- **Children** are pinned: `uses: LedgerHQ/ledger-live/.github/workflows/<x>-reusable.yml@develop` and `LedgerHQ/ledger-live/tools/actions/...@develop`. They always run develop's YAML.
- **Checkout** uses `github.sha` (or `inputs.ref`), so the code, `package.json` scripts and Nx projects come from the caller's branch.

On `develop` the two match. On `release`, `hotfix`, `main` and PRs targeting them, the code can be weeks or months older than the YAML running against it.

## What breaks

A child workflow or action on develop can only rely on what exists on **every** branch that calls it:

- ❌ A new step running `pnpm <new-script>`, `nx run <new-project>:<target>` or a new file path. It fails on release/hotfix, where the script or project doesn't exist yet.
- ❌ A new **required** input on a reusable workflow. Older root workflows don't pass it.
- ❌ Removing or renaming an input or output. Older callers still pass or read it.
- ❌ Changing a composite action's inputs in a way older callers can't satisfy.

Release and hotfix pipelines are the worst place to find this out.

## Do this instead

- Prefer `pnpm exec nx run-many -t <target> -p <project>`. It is a no-op when the project is absent (see `test-boundaries-reusable.yml`). Leave a comment saying why.
- Guard steps on presence, e.g. `if: hashFiles('path/to/new/config') != ''`, or check in the script before running it.
- Give new inputs a `default` and keep them optional. Deprecate inputs before removing them, and remove them only after release and hotfix have caught up.
- To make a new check mandatory everywhere, land the code first, then wire it into the root workflow (which runs at the commit) rather than the `@develop` child. Or wait until the change has reached `main` before you make the child depend on it.
- Composite actions are local to the repo, but `@develop` pins them the same way, so the same rules apply.

## Checklist

- [ ] Every command the changed child runs exists on `release` and `main` today (`git show origin/release:package.json`, `git ls-tree origin/main -- <path>`)
- [ ] New inputs are optional with defaults, and no inputs or outputs were removed
- [ ] Any guard you rely on is explained in a short comment at the step

## Test a child change before merge

PR checks run develop's copy of every `@develop` child, so they do not run your change.
That does not make the change untestable. Run the child yourself from a scratch branch.

1. Branch off your PR branch: `git switch -c ci-test/<topic>`. Do not push the next edit to the PR branch.
2. On the scratch branch, change `@develop` to `@ci-test/<topic>` on each `uses:` line between the
   workflow you will dispatch and the file you changed:
   - composite action: `uses: LedgerHQ/ledger-live/tools/actions/composites/<action>@ci-test/<topic>`
   - nested reusable: `uses: LedgerHQ/ledger-live/.github/workflows/<x>-reusable.yml@ci-test/<topic>`
3. Push, then dispatch the reusable on that branch. `workflow_dispatch` runs the YAML from `--ref`:
   ```sh
   gh workflow run build-desktop-reusable.yml --ref ci-test/<topic> -f ref=ci-test/<topic>
   gh run list -w build-desktop-reusable.yml -b ci-test/<topic> -L1   # get the run id, then: gh run watch <id>
   ```
4. Put the run URL in the PR's **Tested** section, then delete the scratch branch.

If the reusable has no `workflow_dispatch` (`grep -L workflow_dispatch .github/workflows/*-reusable.yml`),
add one on the scratch branch only. Declare any inputs it reads.

### Test older callers (release, hotfix)

The risk this skill describes is new child YAML running against old code. To test that, branch from
`origin/release` (or the hotfix branch). Change only the child refs to `@ci-test/<topic>`, push, then
dispatch with `-f ref=<that branch>`. The run uses your new child on release code.

### Gotcha: a cache replay is not a test

Nx hashes project files, root config files and named env vars (`nx.workspace.json` → `namedInputs`).
It does not hash `.github/**` or `tools/actions/**`. If your change alters how a step runs an Nx target
(flags, env, runner, install options), the task hash stays the same. The run then replays the cached
result and does not run your change. The run is green, but nothing was tested.

- On the scratch branch, set `skip-nx-cache: "true"` on the `setup-caches` step of every job you test.
  That makes the run execute every Nx task again (`NX_SKIP_NX_CACHE=true`).
- Read the log, not only the status. These lines show a replay:
  `[local cache]`, `[remote cache]`, `existing outputs match the cache, left as is`,
  `Nx read the output from the cache instead of running the command for N out of M tasks`.
  If a task you meant to test shows one of them, the run does not count.

The same blind spot affects PR checks. `build-and-test-pr.yml` starts jobs only for projects that
`nx-affected` reports. A PR that changes only CI files affects no project, so those jobs do not start.

### Quick local check

A composite action's `run:` steps are shell commands. Run them locally first when you can, on the same OS
as the runner. This catches mistakes faster than CI, but it does not replace the dispatched run.

### What to write in the PR

- ✅ `CI | Dispatched build-desktop-reusable on ci-test/<topic> with the action repointed and the Nx cache skipped: <run URL> (macOS green)`
- ✅ `Release callers | Same dispatch from a branch of origin/release: <run URL>`
- ❌ `Not testable before merge: PR builds run this action @develop.` Use the steps above instead.
  Write "not testable" only for something a dispatch cannot run (a `schedule`, `merge_group` or
  push-to-develop trigger, or a secret only develop can read). Name that part and say what you checked instead.
