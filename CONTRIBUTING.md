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

We follow conventions for commit messages, pull request titles and branch names. The conventions include consistent naming of the "scope" and "type" of each change. 

#### Scope values

Scope identifies which part of the monorepo a change affects. The canonical list lives in [`.github/scopes.ts`](.github/scopes.ts)

Examples: `desktop`, `mobile`, `common`, `coin-modules`, `shared-lib`, `ui`, `translations`.

`scopes.ts` is also used to generate labels and apply them to pull requests. Read more in [`.github/README.md`](.github/README.md)

#### Commit types

Type describes the nature of a change. Use one of the following values (aligned with [Conventional Commits](https://www.conventionalcommits.org/) and enforced by [commitlint](commitlint.config.js)):

| Type | Use for |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Restructure without behavior change |
| `perf` | Performance improvement |
| `test` | Add or update tests |
| `build` | Build system or external dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance, tooling, configs |
| `revert` | Revert a previous commit |

#### Branch naming

Branch names are recommended but not enforced. Use this pattern:

```
<type>/[<scope>][-<ticket>]-<short-description>
```

- **type** — one of the [commit types](#commit-types) above (for example `feat`, `fix`, `chore`)
- **scope** — a [scope](#scope-values) (for example `desktop`, `mobile`, `common`) (optional)
- **ticket** — Jira issue key when applicable (for example `LIVE-27608`); (optional)
- **short-description** — kebab-case summary of the change

Examples:

- `feat/desktop-LIVE-1234-add-dark-mode-toggle`
- `fix/mobile-resolve-transaction-signing`
- `chore/automation-update-labeler-config`

Use kebab-case, keep names short and action-oriented, and limit each branch to one isolated concern.

#### Commit message

We use the [Conventional Commits](https://www.conventionalcommits.org/) specification and enforce it using [commitlint](https://commitlint.js.org/) ([`commitlint.config.js`](commitlint.config.js)).

Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Rules:

- **type** — one of the [commit types](#commit-types) above
- **scope** — optional but recommended; must be a [scope](#scope-values) from scopes.ts
- **description** — imperative, lowercase, no trailing period
- **body** — use for complex or user-facing changes
- **footers** — `BREAKING CHANGE: ...` or Jira ticket reference when needed
- **length** — keep the subject line (type, scope, and description) within 72 characters; GitHub truncates longer titles in the UI
- **gitmoji** — not used in this repository

You can use the `pnpm commit` prompt to ensure that your commit messages are valid, as well as the `pnpm commitlint --from <target branch>` command to check that every commit on your current branch are valid.

Examples:

```
feat(desktop): add dark mode toggle
fix(mobile): resolve transaction signing issue
docs(common): update API documentation
refactor(coin-modules): simplify account syncing logic
test(shared-lib): add client-ids unit tests
```

#### Pull request title

Pull request titles follow the same `type(scope): description` pattern as [commit messages](#commit-message).

Examples:

```
feat(desktop): add dark mode toggle
fix(coin-modules): correct fee estimation for bitcoin
chore(automation): harmonize scope definitions
```

A GitHub workflow may automatically prepend a scope prefix based on changed files:

- `[LWD]` — Desktop-only changes
- `[LWM]` — Mobile-only changes
- `[LWDM]` — Common, shared, or cross-platform changes (including both Desktop and Mobile)

The resulting title looks like `[LWD] feat(desktop): add dark mode toggle`. This prefix is used by Jira fix-version automation and should be left in place.

PR titles should be reusable for merge commit naming.

#### Changelogs

We use [**changesets**](https://github.com/changesets/changesets) to handle the versioning of our libraries and apps. A detailed guide is available on the [**wiki**](https://github.com/LedgerHQ/ledger-live/wiki/Changesets).

#### Rebase & Merge strategies

The rule of thumb is to **always favour rebasing** as long as your branch does not contain merge commits.

For instance:

- fix branches that are small and self-contained should always get rebased on top of develop
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
