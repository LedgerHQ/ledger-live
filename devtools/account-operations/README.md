# @devtools/account-operations

Lists the profile's accounts and reads each one's **operation history** through the
[account data layer](../../docs/account-data-layer.md), one page at a time.

Sibling of [`@devtools/account-balances`](../account-balances/README.md), and deliberately a separate
tool rather than a column added to it: the two datums are gated separately, and seeing them answer
from different sources for the same account is the point.

## What it makes visible

- **`Load more` only does something on a source that can resume from a cursor.** On a family served
  by `AccountBridge.sync()` the first read already returned the entire history, so the button is
  disabled rather than hidden: its absence *is* the behaviour.
- **`total unknown, the window is partial`.** A paginated read cannot know how many operations an
  account has. It is what `account.operationsCount` stops being able to promise.
- **`nested` and `token account` tags.** A token transfer and an internal call are ordinary rows in
  the flat model, carrying a link to the operation they came out of and landing on whichever account
  actually owns them.
- **which source answered**: `coin-module` (one page from the coin module) or `full-sync` (the whole
  history from a bridge sync).

## Props

Everything arrives as props (see [`src/types.ts`](./src/types.ts)), built by
[`useAccountOperationsToolProps`](../bindings/src/useAccountOperationsToolProps.ts) in
`@devtools/bindings`. The host supplies only what it alone can know: its accounts shaped as
`AccountRef`s, their names, the display units, and whether the coin module serves operations for
each one.

## Import boundaries

This package may import **no** `@devtools/*` package; see
[the devtools import-boundary rule](../../.agents/skills/devtools-import-boundary/SKILL.md). App
state arrives as props built in `@devtools/bindings`, never through a new import here.
