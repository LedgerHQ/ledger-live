---
name: pre-review
description: Deep code review before opening a pull request. Use when running /pre-review on local changes.
disable-model-invocation: true
---

# Pre-Review

Deep code review before you open a PR.

## Process

1. Run `git diff develop...HEAD` to get the full diff (or the range the user names).

2. Launch 5 `code-reviewer` agents **in parallel**, each with a different focus:
   - **A** — **Layers and boundaries first** (`.agents/skills/structure-flow/SKILL.md`, `.agents/skills/flow-package/SKILL.md`, `.agents/skills/domain-data/SKILL.md`, `.agents/skills/package-public-api/SKILL.md`), then **MVVM** only for paths under `apps/*/src/mvvm/` (`.agents/skills/mvvm-architecture/SKILL.md`). Apply review-only gaps from `.agents/agents/references/review-rules.md`; do not repeat what `pnpm lint:arch` already fails on CI.
   - **B** — Correctness (edge cases, null handling, error states)
   - **C** — Code quality & conventions (Lumen UI, TypeScript, naming, new deps). Reject new `.pnpmfile.cjs` hooks and `pnpm.packageExtensions` (skill `pnpm-resolution`).
   - **D** — General review — DRY, KISS, missing tests, anything that would slow down a reviewer or cause future regressions
   - **E** — Security: invoke the `detect-data-leaks` skill for PII; check for auth bypass, injection, SSRF, crypto misuse; scan the diff for hardcoded secrets, tokens, API keys, or private keys.

   Each agent prompt: _"Review the diff vs develop. Focus on [FOCUS]. Return findings with file:line, severity (🔴 Critical / 🟡 Suggestion / 🟢 Nice to have), and suggested fix."_

3. Merge + deduplicate findings. Present grouped by severity:

   ```
   🔴 Critical — path/to/file.ts:42 — issue → fix
   🟡 Suggestion — ...
   🟢 Nice to have — ...
   Summary: X critical, Y suggestions, Z nice-to-haves
   ```

4. Ask the user which items to fix: **"all criticals"**, **"all"**, **"#1,#2, #3"**, or **"skip"** → `/create-pr`
