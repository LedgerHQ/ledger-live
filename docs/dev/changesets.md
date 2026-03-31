# Changesets

Reference for creating `.changeset/` files using `@changesets/cli`.

## File Naming

Create `.changeset/<adjective-noun-verb>.md` — a human-readable random identifier matching the `@changesets/cli` convention.

Examples: `brave-foxes-sing.md`, `tiny-dogs-jump.md`

## Format

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
| `patch` | Bug fixes, internal-only changes, dependency bumps |
| `minor` | New features and backward-compatible improvements |
| `major` | Breaking changes (rare, requires discussion) |

## Description

- One line, concise but descriptive
- Format: `<verb> <what>` or conventional commit style
- Examples:
  - `Add portfolio analytics dashboard with performance metrics`
  - `Fix transaction signing issue on mobile`
  - `Flush mobile content card click analytics before opening links`
