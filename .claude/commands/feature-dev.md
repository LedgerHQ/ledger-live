# Feature Development

Guided feature development with codebase understanding and architecture focus.

## Usage

`/feature-dev [optional feature description]`

## Process

### Phase 1: Discovery

Understand what needs to be built. If feature is unclear, ask:
- What problem are they solving?
- What should the feature do?
- Any constraints or requirements?

Summarize understanding and confirm with user.

### Phase 2: Codebase Exploration

Launch 2–3 `code-explorer` subagents in parallel, each targeting a different aspect:
- Similar features: trace implementation comprehensively
- Architecture: map abstractions for the feature area
- UX patterns / testing approaches

Read all files identified by the agents before proceeding.

### Phase 3: Clarifying Questions

**DO NOT SKIP.** Review findings and identify underspecified aspects: edge cases, error handling, integration points, scope boundaries, design preferences, backward compatibility, performance needs.

Present all questions. Wait for answers before designing.

### Phase 4: Architecture Design

Launch 2–3 `code-architect` subagents in parallel with different focuses:
- Minimal changes (maximum reuse)
- Clean architecture (maintainability)
- Pragmatic balance (speed + quality)

Present trade-offs, your recommendation with reasoning, and ask the user to choose.

### Phase 5: Implementation

**DO NOT START WITHOUT USER APPROVAL.**

1. Read all relevant files identified in previous phases
2. Implement following chosen architecture
3. Follow `CLAUDE.md` coding standards strictly
4. New code in `src/mvvm/` — MVVM pattern mandatory

### Phase 6: Quality Review

Launch 3 `code-reviewer` subagents in parallel:
- Simplicity/DRY/elegance
- Bugs/functional correctness
- Project conventions/abstractions

Consolidate findings. Ask user which to fix before finishing.

### Phase 7: Validation

Run typecheck and tests for the changed scope (see `CLAUDE.md` Validation section).

### Phase 8: Summary

Document what was built, key decisions, files modified, and suggested next steps.
