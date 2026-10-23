---
name: ci-workflow-refs
description: Root workflows run at the triggering commit but call reusable workflows and composite actions pinned `@develop`, so on release/hotfix/main the child YAML is newer than the code it checks out. Read before changing any reusable workflow (`*-reusable.yml`, `workflow_call`) or composite action under `tools/actions/`, or before adding a CI step that runs a pnpm script, Nx target or repo file.
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
