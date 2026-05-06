---
name: docs-update-or-create
description: |
  Guidelines that must be followed when creating or updating docs in this repo. 
  Applies to AGENTS.md, README.md, **/docs/**/*.md, skill and sub-agent files.
---

# Create or Update Docs

Create minimal docs, avoid duplication and make content discoverable. 
Treat docs for both human and AI agents together.
Follow our principles of progressive disclosure, locality and canonicalization.

## Process to follow

1. Understand the topic of knowledge and its purpose
1. Gather existing knowledge on that topic
1. Agree on the best format and location for it to live
1. Write/update the files, inline with what's agreed
1. Validate the results and refine as necessary

## Guidelines

These guidelines define some boundaries within which to operate. They do not
dictate everything. Follow them, but also use judgement and creativity to find
the best way to document knowledge in each case.

**BAD:**

- Avoid long files containing multiple levels of details
- Avoid overloading context with rarely used knowledge
- Avoid duplicating knowledge in multiple files
- Avoid documenting community-obvious knowledge
- Avoid preserving old structure for its own sake

**GOOD:**

- Add docs that measurably improve agent performance
- Do document repeatable workflows, commands and behaviours
- Capture what is peculiar to this repo, domain, or team
- Only add docs that solve real problems
- Delete files that have no unique value after changes

### Keep it short

- Keep it short and direct. Treat 100 lines as a target (not a hard limit)
- Keep each file at one level of detail.
- Link to narrower docs when detail must branch.
- Use short inline examples when they replace explanation.
- Link longer examples instead of embedding them.

### Use frontmatter

- Skill and agent definitions should use frontmatter to be discoverable by tools.
- Frontmatter for READMEs is optional. If it's useful for you, include it
- Tool-discoverable docs and skills should have `name` and `description`
- Add `applies_to`, `allowed-tools`, or `compatibility` only when they help.
- Use `disable-model-invocation: true` for user-invoked skills (commands)
- Use `user-invocable: false` for agent-only skills

#### Frontmatter Example for a skill

```yaml
---
name: desktop-swap-guidance
description: Read when editing swap flows in Ledger Live Desktop.
applies_to:
  - apps/ledger-live-desktop
---
```

## Principles

- Apply principle of [progressive disclosure](../../../docs/about-docs/progressive-disclosure.md)
- Follow our rules on [docs locality](../../../docs/about-docs/docs-locations.md)
- Avoid duplication by applying rules on [canonicalization](../../../docs/about-docs/canonicalization.md)

## Validation

- Make sure links point to the canonical source
- Ensure it is discoverable by agents and humans
- Search for duplicated key phrases with `rg`
- Check long docs with `wc -l`.
- Verify `AGENTS.md` stays minimal.
