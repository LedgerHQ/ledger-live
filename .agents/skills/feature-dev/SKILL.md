---
name: feature-dev
description: Guided feature development for Ledger Wallet, from placing the code in the right layer through exploration, design, implementation and review. Use when the user asks to build a new feature or capability end to end.
argument-hint: Optional feature description
disable-model-invocation: true
---

# Feature Development

You are helping a developer implement a new feature for Ledger Wallet applications. Follow a systematic approach: understand the codebase deeply, identify and ask about all underspecified details, design elegant architectures, then implement.

## References

- [structure-flow](../structure-flow/SKILL.md) decides which layer and package own each part of the feature.
- [mvvm-architecture](../mvvm-architecture/SKILL.md) covers the app side in `apps/*/src/mvvm/`: screens composing `@features/*` and app-only code.
- New code never goes to `libs/`.

## Core Principles

- **Ask clarifying questions**: Identify all ambiguities, edge cases, and underspecified behaviors. Ask specific, concrete questions rather than making assumptions. Wait for user answers before proceeding with implementation. Ask questions early (after understanding the codebase, before designing architecture).
- **Understand before acting**: Read and comprehend existing code patterns first
- **Read files identified by agents**: When launching agents, ask them to return lists of the most important files to read. After agents complete, read those files to build detailed context before proceeding.
- **Simple and elegant**: Prioritize readable, maintainable, architecturally sound code
- **Use TodoWrite**: Track all progress throughout

---

## Phase 1: Place the Code

**Goal**: Decide which layer and package own each part of the feature before anything else

Initial request: $ARGUMENTS

**Actions**:
1. Create todo list with all phases
2. Read [structure-flow](../structure-flow/SKILL.md) and split the request into concerns: user journey and its UI, capability shared by several flows, business object, data access, generic primitive, app wiring
3. Give each concern the lowest layer that can own it, and name the package: an existing one first (`@features/flow-contacts`, `@domain/entity-contact`, `@domain/api-push-devices`, `@shared/schema-primitives`), a new one only when none fits
4. Keep only the screen composing those packages, and app-only code, in `apps/*/src/mvvm/`
5. Present the placement as a short table (concern, layer, package, new or existing). Later phases work inside it; changing it needs the user's agreement

---

## Phase 2: Discovery

**Goal**: Understand what needs to be built

**Actions**:
1. If feature unclear, ask user for:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
2. Summarize understanding and confirm with user

---

## Phase 3: Codebase Exploration

**Goal**: Understand relevant existing code and patterns at both high and low levels

**Actions**:
1. Launch 2-3 code-explorer agents in parallel. Each agent should:
   - Trace through the code comprehensively and focus on getting a comprehensive understanding of abstractions, architecture and flow of control
   - Target a different aspect of the codebase (eg. similar features, high level understanding, architectural understanding, user experience, etc)
   - Include a list of 5-10 key files to read

   **Example agent prompts**:
   - "Find features similar to [feature] and trace through their implementation comprehensively"
   - "Map the architecture and abstractions for [feature area], tracing through the code comprehensively"
   - "Analyze the current implementation of [existing feature/area], tracing through the code comprehensively"
   - "Identify UI patterns, testing approaches, or extension points relevant to [feature]"

2. Once the agents return, please read all files identified by agents to build deep understanding
3. Present comprehensive summary of findings and patterns discovered

---

## Phase 4: Clarifying Questions

**Goal**: Fill in gaps and resolve all ambiguities before designing

**CRITICAL**: This is one of the most important phases. DO NOT SKIP.

**Actions**:
1. Review the codebase findings and original feature request
2. Identify underspecified aspects: edge cases, error handling, integration points, scope boundaries, design preferences, backward compatibility, performance needs
3. **Present all questions to the user in a clear, organized list**
4. **Wait for answers before proceeding to architecture design**

If the user says "whatever you think is best", provide your recommendation and get explicit confirmation.

---

## Phase 5: Architecture Design

**Goal**: Design multiple implementation approaches with different trade-offs

**Actions**:
1. Launch 2-3 code-architect agents in parallel, each working inside the Phase 1 placement, with different focuses: minimal changes (smallest change, maximum reuse), clean architecture (maintainability, elegant abstractions), or pragmatic balance (speed + quality)
2. Review all approaches and form your opinion on which fits best for this specific task (consider: small fix vs large feature, urgency, complexity, team context)
3. Present to user: brief summary of each approach, trade-offs comparison, **your recommendation with reasoning**, concrete implementation differences
4. **Ask user which approach they prefer**

---

## Phase 6: Implementation

**Goal**: Build the feature

**DO NOT START WITHOUT USER APPROVAL**

**Actions**:
1. Wait for explicit user approval
2. Read all relevant files identified in previous phases
3. Implement following chosen architecture
4. Follow codebase conventions strictly (see References)
5. Write clean, well-documented code
6. Update todos as you progress

---

## Phase 7: Quality Review

**Goal**: Ensure code is simple, DRY, elegant, easy to read, and functionally correct

**Actions**:
1. Launch 3 code-reviewer agents in parallel with different focuses: simplicity/DRY/elegance, bugs/functional correctness, project conventions/abstractions
2. Consolidate findings and identify highest severity issues that you recommend fixing
3. **Present findings to user and ask what they want to do** (fix now, fix later, or proceed as-is)
4. Address issues based on user decision

---

## Phase 8: Summary

**Goal**: Document what was accomplished

**Actions**:
1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified
   - Suggested next steps
