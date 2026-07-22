# Danger JS

## Overview

> Danger runs during your CI process, and gives teams the chance to automate common code review chores.

_https://danger.systems/js/_

## What do we use Danger for?

We use Danger for validating our PR titles. 

In future we may also use it to give PR authors extra information on failing checks, e.g.

- pointing to guidelines when `commitlint` is failing
- ensuring changesets have been added

## How is it setup?

1. **package** – `danger` is installed as an npm dev-dependency
2. **workflow** – [danger.yml](../../.github/workflows/danger.yml) defines how it is run in GitHub
3. **config** –  [dangerfile.ts](./dangerfile.ts) is the entry point targeted by the workflow

## Testing locally

### Run Danger locally

If you are making changes to your pull request, or to the dangerfile you can get feedback locally.

1. Create a new fine-grained personal access token: https://github.com/settings/personal-access-tokens/new
2. It only needs "Public repositories" access
3. Export your token, like: `export DANGER_GITHUB_API_TOKEN=github_pat_xxxxx`
4. Run Danger against your PR, like: `pnpm danger pr https://github.com/LedgerHQ/ledger-live/pull/19915 --dangerfile tools/danger/dangerfile.ts`
5. See feedback in the Terminal before pushing your changes

### Run tests locally

Unit tests have been written to explain the validation functions and give reviewers confidence about the regex.

`pnpm --filter @tools/danger test`

Run this from the root of the repo. 

_Notes: these tests are not currently run in the CI_