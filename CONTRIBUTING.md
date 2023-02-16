# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This file will guide you through the local setup and contains the guidelines you will need
to follow to get your code merged.

## Disclaimer

Regarding Ledger Applications (Ledger Live Desktop, Ledger Live Mobile) we are only accepting bugfixes for the moment.
There is a good chance that we will reject feature based PRs based on the fact that they do not fit our roadmap or our long-term goals.

## Guidelines

### Important Steps

**Before submitting a pull request, please make sure the following is done:**

1. Fork the repository and create your branch from `develop` (check the git conventions for the naming of the branch).
2. Follow the main installation steps. (https://github.com/LedgerHQ/ledger-live#installation)
3. Follow additional installation steps depending on which package you want to contribute to.
4. Make your changes.
5. If you’ve fixed a bug or added code that should be tested, add tests!
6. If needed, wait for the translations to be provided by the third party service.
7. Add an entry to the changelog (`pnpm changeset`).
8. Make sure that the code passes linter and type checks (`pnpm lint:fix` and `pnpm typecheck`).
9. Make sure the code passes unit and end to end tests (`pnpm test`).
10. Cleanup your branch - unless it contains merge commits (perform atomic commits, squash tiny commits…).
11. Profit!

### Git Conventions

We use the following git conventions for the `ledger-live` monorepo.

#### Branch naming

Depending on the purpose every git branch should be prefixed.

- `feat/` when adding a new feature to the application or library
- `bugfix/` when fixing an existing bug
- `support/` for any other changes (refactor, tests, improvements, CI…)

#### Changelogs

We use [**changesets**](https://github.com/changesets/changesets) to handle the versioning of our libraries and apps. A detailed guide is available on the [**wiki**](https://github.com/LedgerHQ/ledger-live/wiki/Changesets).

#### Commit message

We use the standard [**Conventional Commits**](https://www.conventionalcommits.org/) specification and enforce it using [**commitlint**](https://commitlint.js.org/).

You can use the `pnpm commit` prompt to ensure that your commit messages are valid, as well as the `pnpm commitlint --from <target branch>` command to check that every commit on your current branch are valid.

#### Rebase & Merge strategies

The rule of thumb is to **always favour rebasing** as long as your branch does not contain merge commits.

For instance:

- bugfix branches that are small and self-contained should always get rebased on top of develop
- feature branches that have merge commit from other branches (sub-features) should merge their target into them to be kept up to date

**⚠️ Important: do not rebase a branch that is waiting for translations from a third party service.**

### Pull Request Conventions

#### Description

- Fill-in the PR template.
- Write a full description of what your pull request is about and why it was needed.
- Add some screenshots or videos if relevant.
- _For Ledger Employees:_ Add the JIRA issue number to link the issue with the PR.

### Workflow

- Github actions will trigger depending on which part of the codebase is impacted.
- Your PR must pass the required CI actions.
- Your PR must include a changelog (`pnpm changeset`).

### Translations

We use a third party service called [**Smartling**](https://www.smartling.com/) to automate and manage translations for the Ledger Live applications (Desktop and Mobile).

**⚠️ Only add or edit translation files for the english language.**

You can find these files at the following locations:

- Ledger Live Desktop: `apps/ledger-live-desktop/static/i18n/en/app.json`
- Ledger Live Mobile: `apps/ledger-live-mobile/src/locales/en/common.json`

### Developer Portal

Ledger provides the tools and resources you need to build on top of our platform. They are accessible in the [Ledger Developer Portal](https://developers.ledger.com/).
