# Pre-Review

Deep code review before opening a PR.

## Usage

`/pre-review`

## Process

1. Run `git diff develop..HEAD` to get the full diff.

2. Launch 4 `code-reviewer` subagents **in parallel**, each with a different focus:
   - **A** — Architecture & MVVM compliance
   - **B** — Correctness & security (edge cases, null handling, error states)
   - **C** — Code quality & conventions (Lumen UI, TypeScript, naming, new deps)
   - **D** — General review — DRY, KISS, missing tests, future regressions

   Each agent prompt: *"Review the diff vs develop. Focus on [FOCUS]. Return findings with file:line, severity (Critical / Warning / Suggestion), and suggested fix."*

3. Merge + deduplicate findings. Present grouped by severity:

   ```
   Critical — path/to/file.ts:42 — issue → fix
   Warning — ...
   Suggestion — ...
   Summary: X critical, Y warnings, Z suggestions
   ```

4. Ask the user which items to fix: **"all criticals"**, **"all"**, **"#1,#2,#3"**, or **"skip"** → `/create-pr`
