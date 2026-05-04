---
name: create-changeset
description: Create changesets for the ledger-live monorepo using @changesets/cli. Use when the user asks to add a changeset, prepare a release, or document package changes for a PR.
---

# Create Changeset

Create a `.changeset/<adjective-noun-verb>.md` file (human-readable random identifier, matching `@changesets/cli` convention) with this format:

```markdown
---
"package-name": minor
---

Short description of the change
```

## Package Names

Package names **must match exactly** what's in each `package.json`:

| App / Lib | Package name |
|-----------|-------------|
| Mobile app | `live-mobile` |
| Desktop app | `ledger-live-desktop` |
| Common lib | `@ledgerhq/live-common` |
| Coin modules | `@ledgerhq/coin-<name>` (e.g. `@ledgerhq/coin-sui`) |
| Other libs | Check the lib's `package.json` `name` field |

## Impact Levels

| Level | When to use |
|-------|-------------|
| `minor` | New features, bug fixes, non-breaking changes |
| `major` | Breaking changes (rare, requires discussion) |
| `patch` | Internal-only changes, dependency bumps |

## Description

- One line, concise but descriptive
- Format: `<verb> <what>` or conventional commit style
- Examples:
  - `Add portfolio analytics dashboard with performance metrics`
  - `Fix transaction signing issue on mobile`
  - `Flush mobile content card click analytics before opening links`
