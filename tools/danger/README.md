# Danger JS

## Overview

> Danger runs during your CI process, and gives teams the chance to automate common code review chores.

_https://danger.systems/js/_

## What do we use Danger for?

We validate that a PR follows the repository conventions:

- [pr-title.ts](./validation/pr-title.ts) – the PR title is a conventional commit
- [commits.ts](./validation/commits.ts) – every commit in the PR is a conventional commit
- [dependency-checks.ts](./validation/dependency-checks.ts) – the resolved dependency graph in `pnpm-lock.yaml` follows the rules in [dependency-checks](./dependency-checks/README.md)

A last validation, [node-modules-size.ts](./validation/node-modules-size.ts), estimates the `node_modules` size delta from the `pnpm-lock.yaml` diff ([engine](./node-modules-size.ts), no install): it warns and adds the `deps-size` label from +10 MB, fails from +100 MB unless the PR has the `deps-size-approved` label, and thanks the author from −10 MB.

The same diff lists packages already installed that gain one more version, from 1 MB each, with the dependency chain that brought it. It warns when the new version is in the caret range of one already installed (one copy could serve both: align the catalog or add an override); a new major is listed for information. Existing duplicates are never reported, only the ones a PR adds.

[legacy-score.ts](./validation/legacy-score.ts) scores where new code lands ([engine](./legacy-score.ts)): added production `.ts`/`.tsx` lines (no tests, fixtures, mocks, stories, test helpers, configs or generated code) in the [new layers](../../docs/monorepo-architecture.md) (`shared/`, `domain/`, `features/`) divided by those lines plus the net growth (added minus deleted) of legacy areas (`libs/`, desktop `src/renderer` and `src/mvvm`, mobile `src/*/` except composition folders such as `navigation` and `setup`). Below 20% it fails 🔴 unless the PR has the `legacy-code-approved` label (then it only warns), and it reports 🟡 up to 80%; 🟢 and PRs with fewer than 50 counted lines stay silent. Coin modules and per-coin app UI have no new home yet, and test or e2e infrastructure libs are not product code: neither is counted. A file moved across areas counts as whole: deleted at its source, added at its destination. Release and hotfix merge-conflict PRs are exempt. Removing 1000 or more net lines from legacy areas earns a thanks. The `ALLOWLIST` holds legacy folders where shipping is still legitimate, each with a README explaining why.

Run the tests with `pnpm test` from `tools/danger`.

Both title and commit checks read the repo-root [commitlint.config.js](../../commitlint.config.js) via
[commitlint.ts](./commitlint.ts), but **they are deliberately not equally strict**:

- **commits** get the config in full – its own `rules` plus the inherited
  `@commitlint/config-conventional` ones – so CI matches the `hk` `commit-msg` hook exactly.
- **PR titles** get only the `rules` block from `commitlint.config.js`. A title is a single line,
  so the `body-*` and `footer-*` rules cannot apply, and the prose rules (`subject-case`,
  `subject-full-stop`, `type-case`, `header-trim`) are intentionally not enforced on titles.

Merge and revert commits are ignored by `commitlint` itself, and release/hotfix merge-conflict PRs
are exempt from both checks.

Commits are only linted on PRs into `develop` – where they would actually land – so a stacked PR onto
a feature branch is exempt until that branch is PR'd into `develop`.

In future we may also use it to give PR authors extra information on failing checks, e.g.

- ensuring changesets have been added

## How is it setup?

1. **package** – `danger` is installed as a dev-dependency of `@tools/danger`
2. **workflow** – [danger.yml](../../.github/workflows/danger.yml) defines how it is run in GitHub
3. **config** –  [dangerfile.mjs](./dangerfile.mjs) is the entry point targeted by the workflow. Danger imports an `.mjs` dangerfile as is, so Node loads the `.ts` modules with its native type stripping instead of Danger transpiling them with the `typescript` package

The workflow needs almost no git history – commits come from the PR API via `danger.git.commits` – so the
checkout is limited to 2 commits (the PR merge commit and its base, for the lockfile diff).

## Run Danger locally

If you are making changes to your pull request, or to the dangerfile you can get feedback locally.

1. Create a new fine-grained personal access token: https://github.com/settings/personal-access-tokens/new
2. It only needs "Public repositories" access
3. Export your token, like: `export DANGER_GITHUB_API_TOKEN=github_pat_xxxxx`
4. From `tools/danger`, run Danger against your PR:

```bash
cd tools/danger
pnpm danger pr https://github.com/LedgerHQ/ledger-live/pull/19915 --dangerfile dangerfile.mjs
```

1. See feedback in the Terminal before pushing your changes
2. 