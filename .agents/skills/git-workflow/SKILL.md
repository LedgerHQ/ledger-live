---
name: git-workflow
description: Git workflow and commit conventions for Ledger Wallet
---

# Git Workflow & Commit Conventions

Canonical guidelines: [CONTRIBUTING.md — Git Conventions](../../../CONTRIBUTING.md#git-conventions).

Before creating a branch, commit, or PR title, read that section. 

## Agent-specific

- **Never use `--no-verify`** when committing or pushing. Fix hook failures; if a hook is broken, surface it to the user.
