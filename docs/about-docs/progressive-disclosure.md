---
name: progressive-disclosure
description: |
  A principle of revealing details step-by-step to avoid context overload.
  Promotes and describes a way of structuring documentation within the repo. 
---

# Progressive Disclosure

**Let users and agents pull on the context they need as and when they need it**

## Context

Ledger Wallet is a large monorepo with **widely varied context** across 
different apps, libs and tools. AI and human developers need guidance that is 
easy to find without loading irrelevant context on every action.

## Decision

Organize documentation (agentic or otherwise) using progressive disclosure:

- Document via short files that tackle a single topic and single level of detail
- Keep entry points high level with well described links to further details
- Also keep skill and agent files short and well described by their frontmatter

This works together with our principles of [locality](docs-locations.md) 
and [canonicalization](canonicalization.md), resulting in a place for 
everything and everything in its place.

## Consequences

Agents load relevant context as needed.
