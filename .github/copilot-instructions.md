# Copilot Automated Reviewer Instructions

- See [`AGENTS.md`](../AGENTS.md) for general repo context
- Use [`.agents/agents/code-reviewer.md`](../.agents/agents/code-reviewer.md) to review the PR
- Architecture gaps CI does not fully enforce live in [`.agents/agents/references/review-rules.md`](../.agents/agents/references/review-rules.md); prioritize those over restating `pnpm lint:arch` failures
- Authors should run `.agents/skills/validate-changes/SKILL.md` before merge; do not duplicate the same arch lint list it already runs
- For `e2e/**` and `libs/live-e2e-shared/**` changes, the E2E conventions are project guidelines. Apply the [shared E2E conventions](../e2e/docs/e2e-conventions.md) and those of the client the diff touches: [mobile](../e2e/mobile/docs/e2e-mobile-conventions.md) and [mobile elements](../e2e/mobile/docs/e2e-mobile-elements.md), or [desktop](../e2e/desktop/docs/e2e-desktop-conventions.md)
