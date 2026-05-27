---
name: codeownership
description: Maintain CODEOWNERS file and team specific directories. Use when working with "**/team-*/**" file structure or to split an old file into team-specific parts
---

# Codeownership

## Why

- To reduce cross-team review bottlenecks

## What

- Make ownership of team specific directories clear
- Organise some directories into team-specific sub-directories
- Maintain CODEOWNERS files when team specific directories are added or removed
- Split monolithic files or folders that have been identified as being touched by too many teams

## Target

### Splitting a monolithic file

- Split `[foo].ts` into `[foo]/team-[name]/*.ts`

### Maintaining team specific directories

#### Example

**`/shared/feature-flags/src/flags/`** contains `team-coin-integration`, `team-engagement`, `team-live-devices`, etc.

**`CODEOWNERS`** defines the owner for each of these:

```
**/team-coin-integration/         @ledgerhq/coin-integration
**/team-engagement/               @ledgerhq/engagement
**/team-live-devices/             @ledgerhq/live-devices
```
