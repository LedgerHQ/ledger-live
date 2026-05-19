---
name: canonical-docs
description: |
  This doc promotes a single source of truth for each item of knowledge.
  Relates to creation and maintenance of markdown files.
---

# Canonical Knowledge

Have a single source-of-truth for each item of knowledge (agent or otherwise).

## Context

Different humans and agent tools need different kinds of guidance:

- Durable facts about the repo
- Local conventions for apps and libs
- Repeatable workflows
- Tool-specific details

When these are considered in isolation knowledge gets duplicated. Duplicated guidance becomes stale and hard to manage, increasing the cost of routine work and maintenance.

## Decision

1. Manage all forms of docs together
2. Avoid duplication
3. Have clear guidance around docs locations

See [docs-locations](./docs-locations.md) for where to put each type of doc.

### Guidelines

- Treat docs like `README.md` files as part of the same system as agent docs
- Prefer refining existing docs over duplicating knowledge in new ones
- If you see valuable content in a non-canonical location, migrate it
- Follow open formats for agent files to maximise sharing across tools
- Keep tool-specific directories as small as possible
- Use symlinks if necessary, e.g. `.claude/skills -> .agents/skills`
- Discard obvious, stale, or community-generic content
- Continuously refine and improve the knowledge base

### Examples

#### Good

`/.agents/skills/e2e-desktop-add-or-update/SKILL.md` is for end-to-end tests on desktop. Most tools find this location automatically, others require a symlink from their own system to the shared location. Frontmatter describes the skill and a link from the body points to local markdown in `/e2e/desktop/docs`.

#### Bad

Valuable context in silos (e.g. Cursor rules) duplicates work and becomes hard to share. It should be migrated to the canonical structure using the `/docs-migrate` skill.

## Consequences

- Fewer files to read and maintain
- Easier access to useful context, for all agent tools and humans
