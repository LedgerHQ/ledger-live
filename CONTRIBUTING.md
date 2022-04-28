# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This file will guide you through the local setup and contains the guidelines you will need
to follow to get your code merged.

## Disclaimer

Regarding Ledger Applications (Ledger Live Desktop, Ledger Live Mobile) we are only accepting bugfixes. There is a good chance that we will reject feature based PRs based on the fact that they do not fit our roadmap or our long-term goals.

## Guidelines

### Important Steps

**Before submitting a pull request, please make sure the following is done:**

1. Fork the repository and create your branch from `develop` (check the git conventions for the naming of the branch).
2. Follow the main installation steps. (https://github.com/LedgerHQ/ledger-live/tree/monorepo-documentation#installation)
3. Follow additional installation steps depending on which package you want to contribute to.
4. Make your changes.
5. If you’ve fixed a bug or added code that should be tested, add tests!
6. Cleanup your branch. (make atomic commits, squash tiny commits, prevent unnecessary merge commits…)
7. Make sure that the code passes linter and type checks (`pnpm lint:fix` and `pnpm typecheck`).
8. Make sure the code passes unit and end to end tests (`pnpm test`).
9. Add an entry to the changelog. (`pnpm changelog`)
10. Profit!

### Git Conventions

We use the following git conventions for the `ledger-live` monorepo.

#### Branch naming

Depending on the purpose every git branch should be prefixed.

- `feat/` when adding a new feature to the application or library
- `bugfix/` when fixing an existing bug
- `support/` for any other changes (refactor, tests, improvements, CI…)
- `hotfix/` is reserved when making a critical fix outside of the traditional release flow

#### Commit message

_No specific rules at this point in time (this may change in the future though), use common sense and well known good practices._

- Keep your commit message short.
- Your message should describe clearly the change.
- You may use a prefix / scope to label the change.

Following the [Conventional Commits](https://www.conventionalcommits.org/) specification is not mandatory but if you do it will be appreciated.

#### Rebase & Merge strategies

The rule of thumb is to **always prefer rebasing** as long as your branch does not contain merge commits.

For instance:

- bugfix branches that are small and self-contained should always get rebased on top of develop
- feature branches that have merge commit from other branches (sub-features) should merge their target into them to be kept up to date

### Pull Request Conventions

#### Description

- Fill-in the PR template.
- Write a full description of what your pull request is about and why it was needed.
- Add some screenshots or videos if relevant.
- _For Ledger Employees:_ Add the JIRA issue number to link the issue with the PR.

### Workflow

- Github actions will trigger depending on which part of the codebase is impacted.
- Your PR must pass the required CI actions.
- Your PR must include a changelog (`pnpm changelog`).
