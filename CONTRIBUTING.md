# Contributing to Ledger Wallet

Thanks for contributing! These guidelines apply to internal and external contributors, including agents. Please read fully before opening a pull request.

> [!IMPORTANT]
> For **Ledger Wallet** we are currently accepting bug fixes and invited contributions only. Feature PRs that do not align with our roadmap or long-term goals will be closed without extensive review.

## Getting Started

1. External contributors should fork the repository.
2. Create your branch from `develop`.
3. Follow the [main README](README.md) to get started.
4. Follow additional setup instructions in the README files of the app or lib you are working on.

## Branch, Commit & PR Conventions

We use repo-wide conventions for branch names, commit messages, pull request
titles and merge commit titles. The canonical rules live in
[Git conventions](docs/git-conventions.md).

Short version:

```text
branch: <type>/<scope>[-<ticket>]-<short-description>
commit: <type>(<scope>): <description>
pr:     <type>(<scope>): <description> [(<ticket>)]
```

The Jira ticket is optional. Include it when one exists.

Examples:

```text
chore/automation-LIVE-27608-update-git-guidelines
chore(automation): harmonize git guidelines (LIVE-27608)
```

Use `fix/` instead of the legacy `bugfix/` branch prefix, use `chore/` instead
of `support/`, and do not use gitmoji.

Use `pnpm commit` for an interactive prompt, or
`pnpm commitlint --from <target-branch>` to validate your branch.

### Rebase & merge strategy

**Always prefer rebasing** unless your branch contains merge commits from
sub-features.

- Small, self-contained branches -> rebase on `develop`.
- Branches with cross-branch merges -> merge `develop` into them to stay up to
  date.

## The PR Lifecycle

Open your PR as a **Draft** and pass all automated checks before making it **Ready for Review**.

```mermaid
flowchart LR
    S0[Create draft<br>pull request] --> S1[Pass all<br>automated checks]
    S1 --> S2[Open pull request:<br>Ready for review]
    S2 --> S3[Pass review<br>by code-owners]
```

### Automated checks

Before marking your PR ready for review, ensure all of the following pass:

- **lint, TypeScript** — all linter and type checks must pass.
- **unit tests, e2e** — all tests must be green. See [testing requirements](https://developers.ledger.com/docs/ledger-live/contributing/reference/testing).
- **SonarQube** — a green state is expected: meet the quality gate (expected test coverage, no unhandled code smells). See [SonarQube Guide](docs/contributing/sonarqube-guide.md).
- **Copilot** — request a Copilot review, address or explicitly dismiss every comment, and resolve all threads.

### Ready for review

- Click **"Ready for review"** to convert from Draft — this automatically requests the relevant code owners via `CODEOWNERS`.
- When a reviewer leaves feedback and you push a fix, **re-request their review** (GitHub "Re-request" button).
- If you receive a review request for files you don't own, feel free to remove yourself from the Reviewers panel.


> [!IMPORTANT]
> If you are a code owner, see [REVIEWING.md](REVIEWING.md) for reviewer guidance, including your daily review queue.

## Changelogs

We use [changesets](https://github.com/changesets/changesets) for versioning. Run:

```bash
pnpm changeset
```

A changeset is **required** for any user-facing change or library API modification. See the [wiki](https://github.com/LedgerHQ/ledger-live/wiki/Changesets) for the full guide.

## Translations

We use [Smartling](https://www.smartling.com/) for automated translations.

**Only edit the English source files.** Never commit files for other locales.

See the README files of [Ledger Wallet Desktop](apps/ledger-live-desktop) and [Ledger Wallet Mobile](apps/ledger-live-mobile) for the source file paths.

## Developer Portal

Tools and resources for building on Ledger are at the [Ledger Developer Portal](https://developers.ledger.com/).

## Appendix: Tips

#### Request Copilot while still in Draft

> [!TIP]
> <img width="500" alt="Request Copilot on a Draft PR" src="https://github.com/user-attachments/assets/1326c947-61bc-4793-b70c-9e39b04eb630" />

#### Re-request review after pushing fixes

> [!TIP]
> <img width="500" alt="Re-request review on a reviewer that did the review" src="https://github.com/user-attachments/assets/80f83822-0557-4375-8ed6-a4aebfcb5d10" />
