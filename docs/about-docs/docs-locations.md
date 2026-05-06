---
name: docs-location
description: |
  Latest decisions on where to store knowledge in docs.
  Applies to markdown used by humans and agents.
  Applies to READMEs, AGENTS, skills and sub-agent files. 
  Works in conjunction with rules on progressive disclosure.
---

# Docs Locations

Know where to put everything.

## The target structure

| Where to find it              | What it is                                   |
|-------------------------------|----------------------------------------------|
| `/.agents/skills/**/SKILL.md` | Workflow, command or behavior guidance       |
| `/.agents/agents/*.md`        | A sub-agent for a specialist type of work    |
| `/AGENTS.md`                  | Global context needed by every task          |
| `/docs/**/*.md`               | Additional details under `AGENTS.md`         |
| `**/README.md`                | Local context needed in a specific directory |
| `**/docs/**/*.md`             | Additional details under local READMEs       |

## Notes

**Use symlinks to ensure tools can find the contents of the shared `.agents` directory:**
- e.g. `.claude/skills -> .agents/skills`

**The current documentation state is not the target**
- Some valuable context is spread across Cursor rules and other markdown
- The `**/README.md` and `**/docs/**/*.md` convention is not applied everywhere
