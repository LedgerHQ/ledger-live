---
name: ci-workflow-refs
description: Root workflows run at the triggering commit but call reusable workflows and composite actions pinned `@develop`, so on release/hotfix/main the child YAML is newer than the code it checks out. Read before changing any reusable workflow (`*-reusable.yml`, `workflow_call`) or composite action under `tools/actions/`, or before adding a CI step that runs a pnpm script, Nx target or repo file. Also read before writing how a CI change was tested, or before saying a CI change cannot be tested before merge.
---

# CI Workflow Refs (split brain)

## How it runs

- **Root workflows** (`build-and-test-push.yml`, `build-and-test-pr.yml`, `merge-queue.yml`, `release-*.yml`) run from the triggering commit's YAML.
- **`merge-queue.yml`** only runs for PRs targeting `develop`, so its YAML always matches the children. An input passed only from `merge-queue.yml` can be renamed or removed in the same PR as the child, with no deprecation.
- **Children** are pinned: `uses: LedgerHQ/ledger-live/.github/workflows/<x>-reusable.yml@develop` and `LedgerHQ/ledger-live/tools/actions/...@develop`. They always run develop's YAML.
- **Checkout** uses `github.sha` (or `inputs.ref`), so the code, `package.json` scripts and Nx projects come from the caller's branch.

On `develop` the two match. On `release`, `hotfix`, `main` and PRs targeting them, the code can be weeks or months older than the YAML running against it.

## What breaks

A child workflow or action on develop can only rely on what exists on **every** branch that calls it:

- ❌ A new step running `pnpm <new-script>`, `nx run <new-project>:<target>` or a new file path. It fails on release/hotfix, where the script or project doesn't exist yet.
- ❌ A new **required** input on a reusable workflow. Older root workflows don't pass it.
- ❌ A root workflow passing an input that develop's child does not declare yet, even an optional one. GitHub checks the call against the `@develop` child and rejects the whole root workflow ("Invalid workflow file … is not defined in the referenced workflow"), so every PR check stops. actionlint and a scratch-branch dispatch read your branch's child, so neither catches it.
- ❌ Removing or renaming an input or output. Older callers still pass or read it.
- ❌ Changing a composite action's inputs in a way older callers can't satisfy.

Release and hotfix pipelines are the worst place to find this out.

## Do this instead

- Prefer `pnpm exec nx run-many -t <target> -p <project>`. It is a no-op when the project is absent (see `test-boundaries-reusable.yml`). Leave a comment saying why.
- Guard steps on presence, e.g. `if: hashFiles('path/to/new/config') != ''`, or check in the script before running it.
- Give new inputs a `default` and keep them optional. Deprecate inputs before removing them, and remove them only after release and hotfix have caught up.
- To make a new check mandatory everywhere, land the code first, then wire it into the root workflow (which runs at the commit) rather than the `@develop` child. Or wait until the change has reached `main` before you make the child depend on it.
- To pass a new input from a root workflow, use two PRs. First add the input to the child, optional with a default. Then pass it from the root once the child is on develop.
- Composite actions are local to the repo, but `@develop` pins them the same way, so the same rules apply.

### Clean up guards and deprecations

A presence guard, a `run-many` no-op or a deprecated input is temporary. It is needed only until
release, hotfix and main have the change. When you add one:

- Create a Jira ticket to remove it after two release cycles. In the ticket, name the guard (file and
  step) and the check that shows it can go, e.g. `git ls-tree origin/hotfix -- <path>` or
  `git show origin/main:package.json` has the script.
- Put the ticket key in the comment at the guard, e.g.
  `# Guard until hotfix has <path>. Remove in LIVE-1234.`

## Checklist

- [ ] Every command the changed child runs exists on `release` and `main` today (`git show origin/release:package.json`, `git ls-tree origin/main -- <path>`)
- [ ] New inputs are optional with defaults, and no inputs or outputs were removed
- [ ] Every `with:` key a changed root workflow passes to a `@develop` child is declared under develop's `workflow_call` (`git show origin/develop:.github/workflows/<child>.yml | sed -n '/^  workflow_call:/,/^[a-z]/p' | grep -n '^      <input>:'`)
- [ ] Any guard you rely on is explained in a short comment at the step
- [ ] Each guard or deprecated input has a cleanup ticket, and its key is in the comment at the step

## Test a child change before merge

PR checks run develop's copy of every `@develop` child, so they do not run your change.
That does not make the change untestable. Run the child yourself from a scratch branch.

1. Rebase your PR branch on `origin/develop`, then branch off it: `git switch -c ci-test/<topic>`.
   Do not push the next edit to the PR branch.
2. On the scratch branch, change `@develop` to `@ci-test/<topic>` on each `uses:` line between the
   workflow you will dispatch and the file you changed:
   - composite action: `uses: LedgerHQ/ledger-live/tools/actions/composites/<action>@ci-test/<topic>`
   - nested reusable: `uses: LedgerHQ/ledger-live/.github/workflows/<x>-reusable.yml@ci-test/<topic>`
3. Push, then dispatch the reusable on that branch. `workflow_dispatch` runs the YAML from `--ref`:
   ```sh
   gh workflow run build-desktop-reusable.yml --ref ci-test/<topic> -f ref=ci-test/<topic>
   gh run list -w build-desktop-reusable.yml -b ci-test/<topic> -L1   # get the run id, then: gh run watch <id>
   ```
   Do not open a PR for the scratch branch. The dispatch does not need one, and a PR gets a Copilot
   review and runs the PR checks.
4. Put the run URL in the PR's **Tested** section, then delete the scratch branch.

If the reusable has no `workflow_dispatch` (`grep -L workflow_dispatch .github/workflows/*-reusable.yml`),
add one on the scratch branch only. Declare any inputs it reads.

### Test older callers (release, hotfix)

Your first dispatch checks out your scratch branch: develop as of your last rebase, plus your change.
Rebase first so it matches what the child will meet on develop. After merge, release, hotfix and main
also run the child, against older code. Use the checklist above first. Run a second dispatch only if
the change depends on something those branches may not have (a script, Nx target, file, input,
dependency version or lockfile entry), or if you cannot tell. Dispatch the same scratch branch and
point `ref` at the older branch:

```sh
gh workflow run <x>-reusable.yml --ref ci-test/<topic> -f ref=release
```

`--ref` picks the YAML (develop plus your change, as release will run it after merge). `ref` picks the
code that is checked out.

### Gotcha: a cache replay is not a test

Jobs pass builds to each other through caches keyed on source files, not on CI files. If your change
alters how something is built, a cache hit hands the next job a build that an older CI made. The run
is green, but nothing was tested.

- **Nx tasks**: Nx hashes project files, root config files and named env vars (`nx.workspace.json` →
  `namedInputs`), not `.github/**` or `tools/actions/**`. Set `skip-nx-cache: "true"` on the
  `setup-caches` step of every job you test (`NX_SKIP_NX_CACHE=true`). In the log, `[local cache]`,
  `[remote cache]`, `existing outputs match the cache, left as is` or
  `Nx read the output from the cache instead of running the command` mean a replay.
- **Mobile native builds** (`test-mobile-e2e-reusable.yml`): `determine-builds` looks up the iOS and
  Android native builds in the S3 cache, keyed on the app's native folders and a version suffix.
  On a hit, the build job skips the native build, and `skip-nx-cache` does not change that. On the
  scratch branch, change the suffix in the `Determine cache keys` step (e.g. `-detox-native-ios-4` →
  `-detox-native-ios-4-ci-test`). Then check that `ios_native_exists` / `android_native_exists` is
  `false` and that the native build step ran.
- **Desktop e2e userdata** is always restored from develop's cache. A change to how it is generated
  cannot be tested through an e2e run.
- **Artifacts within one run** (`upload-artifact` → `download-artifact`) are safe only if the job that
  uploads them ran the step you changed.

### Gotcha: a skipped job is green too

- In `build-and-test-pr.yml`, a child job runs only if `nx-affected` lists its path
  (`if: contains(needs.determine-affected.outputs.paths, '<path>')`). A green `nx-affected` does not
  mean the job you changed ran. A PR that changes only CI files affects no project, so those jobs do
  not start.
- Some children get values from the root as inputs (`js_bundle_hash_*`, `build-web-tools`,
  `affected_paths`). A dispatch does not run the root. `-f` can only set inputs declared under
  `workflow_dispatch`. An input declared only under `workflow_call` is empty in a dispatch: its
  default does not apply, and `-f` rejects it. To set one, declare it under `workflow_dispatch`
  on the scratch branch. Steps gated on these inputs can behave differently from the PR path.
- Before a run counts, open the job you changed and check that it ran and that the step you changed
  ran. It must not be skipped, and it must not be a cache replay.

### Quick local check

A composite action's `run:` steps are shell commands. Run them locally first when you can, on the same OS
as the runner. This catches mistakes faster than CI, but it does not replace the dispatched run.

### What to write in the PR

- ✅ `CI | Dispatched build-desktop-reusable on ci-test/<topic> with the action repointed and the Nx cache skipped. Job "macOS Build", step "Build desktop" ran: <run URL>`
- ✅ `Release callers | Same dispatch with -f ref=release: <run URL>` (only when you ran it)
- ❌ `Not testable before merge: PR builds run this action @develop.` Use the steps above instead.
  Write "not testable" only for something a dispatch cannot run (a `schedule`, `merge_group` or
  push-to-develop trigger, or a secret only develop can read). Name that part and say what you checked instead.
