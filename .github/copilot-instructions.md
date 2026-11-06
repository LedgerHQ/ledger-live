# Copilot Automated Reviewer Instructions

- See [`AGENTS.md`](../AGENTS.md) for general repo context
- Use [`.agents/agents/code-reviewer.md`](../.agents/agents/code-reviewer.md) to review the PR
- Architecture gaps CI does not fully enforce live in [`.agents/agents/references/review-rules.md`](../.agents/agents/references/review-rules.md); prioritize those over restating `pnpm lint:arch` failures
- Authors should run `.agents/skills/validate-changes/SKILL.md` before merge; do not duplicate the same arch lint list it already runs
