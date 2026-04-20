---
name: pre-review
description: Deep code review
disable-model-invocation: true
---

# Pre-Review

Deep code review

## Process

1. Run `git diff develop..HEAD` to get the full diff.

2. Launch 4 `code-reviewer` agents **in parallel**, each with a different focus:
   - **A** — Architecture & MVVM compliance
   - **B** — Correctness & security (edge cases, null handling, error states)
   - **C** — Code quality & conventions (Lumen UI, TypeScript, naming, new deps)
   - **D** — General review — DRY, KISS, missing tests, anything that would slow down a reviewer or cause future regressions

   Each agent prompt: _"Review the diff vs develop. Focus on [FOCUS]. Return findings with file:line, severity (🔴 Critical / 🟡 Suggestion / 🟢 Nice to have), and suggested fix."_

3. Merge + deduplicate findings. Present grouped by severity:

   ```
   🔴 Critical — path/to/file.ts:42 — issue → fix
   🟡 Suggestion — ...
   🟢 Nice to have — ...
   Summary: X critical, Y suggestions, Z nice-to-haves
   ```

4. Ask the user which items to fix: **"all criticals"**, **"all"**, **"#1,#2, #3"**, or **"skip"** → `/create-pr`
