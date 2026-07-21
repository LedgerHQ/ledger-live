# Copilot Automated Reviewer Instructions

- Use [`.agents/agents/code-reviewer.md`](../.agents/agents/code-reviewer.md) to review the PR
- See [`AGENTS.md`](../AGENTS.md) for general repo context

## Draft PRs: workflow branch pins

While a pull request is **in draft**, do not flag GitHub Actions workflow or
composite-action `uses:` references that are pinned to the PR's own head branch
(for example `uses: LedgerHQ/ledger-live/...@<this-pr-branch>`). These are
intentional, temporary pins that let contributors exercise workflow/composite
changes on the branch itself; they are reverted to `@develop` (or a stable
tag/SHA) before the PR is marked ready for review.

Once the PR is **ready for review** (out of draft), resume flagging any such
self-branch pins, since they must not be merged.
