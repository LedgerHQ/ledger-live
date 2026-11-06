# Copilot Automated Reviewer Instructions

- See [`AGENTS.md`](../AGENTS.md) for general repo context
- Use [`.agents/agents/code-reviewer.md`](../.agents/agents/code-reviewer.md) to review the PR
- Architecture gaps CI does not fully enforce live in [`.agents/agents/references/review-rules.md`](../.agents/agents/references/review-rules.md); prioritize those over restating `pnpm lint:arch` failures
- Authors should run `.agents/skills/validate-changes/SKILL.md` before merge; do not duplicate the same arch lint list it already runs

**Team channel:** Post a short note when this PR merges that Copilot review now follows `code-reviewer.md`, `review-rules.md`, and the architecture skills (`structure-flow`, `flow-package`, and related) so everyone knows PR feedback may include layer and dual-platform review-only checks.
