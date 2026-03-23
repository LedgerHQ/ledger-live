# Create Changeset

Create a `.changeset/<adjective-noun-verb>.md` file following `@changesets/cli` conventions.

## Format

```markdown
---
"package-name": minor
---

Short description of the change
```

## Package Names

| App / Lib | Package name |
|-----------|-------------|
| Mobile app | `live-mobile` |
| Desktop app | `ledger-live-desktop` |
| Common lib | `@ledgerhq/live-common` |
| Coin modules | `@ledgerhq/coin-<name>` |
| Other libs | Check the lib's `package.json` `name` field |

## Impact Levels

| Level | When to use |
|-------|-------------|
| `minor` | New features, bug fixes, non-breaking changes |
| `major` | Breaking changes (rare, requires discussion) |
| `patch` | Internal-only changes, dependency bumps |

## Description

- One line, concise but descriptive
- Format: `<verb> <what>`
- Examples:
  - `Add portfolio analytics dashboard with performance metrics`
  - `Fix transaction signing issue on mobile`
