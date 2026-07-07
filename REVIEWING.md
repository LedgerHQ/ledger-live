# PR Review Guide

A practical reference for **code-owner reviewers**. For automated AI review, see [`.agents/agents/code-reviewer.md`](.agents/agents/code-reviewer.md).

> [!TIP]
> Check your incoming review requests daily:
> 👉 [my GitHub Inbox](https://github.com/pulls/inbox)

## Before you review

A PR should only reach your queue once all [automated checks](CONTRIBUTING.md#automated-checks) are complete (CI, SonarQube, Copilot).
If a PR lands in your queue without meeting these, you can leave a comment and ask the author to put it back in Draft.

## Reviewing

### Scope your review to files you own

Use GitHub's file tree to filter the diff to files your team owns. Mark files as "Viewed" as you go.

> [!NOTE]
> If you notice files in the diff that are **not covered by any `CODEOWNERS` entry**, update `CODEOWNERS` yourself to claim them. Unclaimed files get reviewed by nobody.

### What to look for

Focus on things automated tools cannot catch:

- **Requirements** — does the code actually solve what the linked issue describes?
- **Correctness** — is the logic sound? Are edge cases and error paths handled?
- **Design** — does this fit the existing architecture? Are there simpler approaches?
- **Trade-offs** — are technical decisions and any incurred debt clearly explained in the description?
- **New dependencies** — are they justified? Check bundle size and peer compatibility.
- **Performance** — have the changes been profiled or benchmarked where necessary?
- **Cross-team impact** — does this touch shared APIs or contracts that affect other teams?

Leave style, lint, and code-smell comments to Copilot and SonarQube.

### Leaving feedback

- Be specific: file path, line reference, concrete suggestion. Consider using [Conventional Comments](https://conventionalcomments.org/) to make intent clear.
- Distinguish between blockers (must fix before merge) and suggestions (nice to have).
- Resolve threads once addressed, or explicitly state why you disagree.

## Appendix: Tips

#### Scope your review to files you own

> [!TIP]
> <img width="500" alt="Only files owned by you" src="https://github.com/user-attachments/assets/1966a4eb-6921-49d5-ad01-da7a2e70cf23" />

#### Remove accidental review requests

If a rebase pulled in your name on files you don't own, feel free to uncheck yourself from the Reviewers panel.

> [!TIP]
> <img width="500" alt="Remove request for unwanted teams" src="https://github.com/user-attachments/assets/e9b5a5aa-d4e8-4fde-8a88-f59738924299" />
