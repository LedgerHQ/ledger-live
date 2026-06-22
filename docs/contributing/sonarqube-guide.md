# SonarQube Guide

SonarQube runs automatically on every PR and surfaces code quality issues, security hotspots, and test coverage gaps. All findings must be addressed before marking your PR ready for review.

## 1 — Log in with GitHub

SonarQube uses GitHub OAuth. Make sure you are logged in before trying to view or action any findings.

<img width="463" height="377" alt="Log in to SonarQube with GitHub" src="https://github.com/user-attachments/assets/44e37480-655e-4fed-84fb-1373e301bce1" />

## 2 — Handling issues (code smells, bugs, security hotspots)

For **new code you introduce**, passing SonarQube quality gates is expected. For **refactored or pre-existing code** where fixing now is not practical, you have options.

For every finding, pick one of these three actions — and **use the comment section to document your reasoning**:

| Action | When to use |
|--------|-------------|
| **Fix it** | Preferred. Address the issue in this PR. |
| **Accept / Won't Fix** | Refactoring is out of scope right now. Leave a comment explaining when or why it will be addressed. |
| **False Positive** | The tool is wrong. Leave a comment explaining why this pattern is intentional or correct. |

Leaving findings unacknowledged (no action, no comment) blocks the PR from moving forward.

<img width="1552" height="1354" alt="Handle a code smell / issue on SonarQube" src="https://github.com/user-attachments/assets/9b76802a-e80b-4904-9866-3c165f95384c" />

## 3 — Test coverage

Code coverage is expected to stay **above the project quality gate thresholds**. SonarQube measures coverage on the new code introduced by your PR specifically — you are not responsible for pre-existing coverage gaps in files you didn't meaningfully change.

- Adding new logic without tests will fail the quality gate.
- If coverage on a touched file drops, add tests to compensate.

## Common pitfalls

| Situation | What to do |
|-----------|------------|
| SonarQube check is pending | It runs after CI — make sure CI is green first. |
| False positive on a framework pattern | Mark as false positive with a short explanation (e.g. "React hook pattern, not a real leak"). |
| Pre-existing issue surfaced by your PR | Mark as "Accept" with a note that it predates this PR. |
| Coverage drops on a file you barely touched | You are not required to fix pre-existing gaps, but document it if flagged. |
