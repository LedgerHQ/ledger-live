# Danger JS

## Overview

> Danger runs during your CI process, and gives teams the chance to automate common code review chores.

_https://danger.systems/js/_

## What do we use Danger for?

We validate that a PR follows the repository conventions:

- [pr-title.ts](./validation/pr-title.ts) – the PR title is a conventional commit
- [commits.ts](./validation/commits.ts) – every commit in the PR is a conventional commit

Both read the repo-root [commitlint.config.js](../../commitlint.config.js) via
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
3. **config** –  [dangerfile.ts](./dangerfile.ts) is the entry point targeted by the workflow

The workflow needs no git history – commits come from the PR API via `danger.git.commits` – so the
checkout stays shallow.

## Run Danger locally

If you are making changes to your pull request, or to the dangerfile you can get feedback locally.

1. Create a new fine-grained personal access token: https://github.com/settings/personal-access-tokens/new
2. It only needs "Public repositories" access
3. Export your token, like: `export DANGER_GITHUB_API_TOKEN=github_pat_xxxxx`
4. From `tools/danger`, run Danger against your PR:

```bash
cd tools/danger
pnpm danger pr https://github.com/LedgerHQ/ledger-live/pull/19915 --dangerfile dangerfile.ts
```

1. See feedback in the Terminal before pushing your changes
2. 