# @devtools/account-operations

Lists the profile's accounts and reads each one's **operation history** through
[`@features/platform-account-data`](../../features/platform/account-data/README.md), one page at a
time.

Sibling of [`@devtools/account-balances`](../account-balances/README.md), and deliberately a separate
tool rather than a column added to it: the two data are read through separate sources, with separate
gates, and seeing them answer differently for the same account is the finding
([LIVE-36923](https://ledgerhq.atlassian.net/browse/LIVE-36923)).

## What it makes visible

- **`Load more` only does something on a source that can resume from a cursor.** On a family served
  by `AccountBridge.sync()` the first read already returned the entire history — the button is
  disabled rather than hidden, because its absence *is* the behaviour.
- **`total unknown, the window is partial`.** A paginated read cannot know how many operations an
  account has. This is the single most important line in the tool: it is what
  `account.operationsCount` stops being able to promise.
- **`nested` and `token account` tags.** A token transfer and an internal call are ordinary rows in
  the flat model, carrying a link to the operation they came out of and landing on whichever account
  actually owns them. Nothing had to be walked to show that.
- **which source answered** — `granular` (one page from the coin module) or `full-sync` (the whole
  history from a bridge sync).

## Props

Everything arrives as props (see [`src/types.ts`](./src/types.ts)), built by
[`useAccountOperationsToolProps`](../bindings/src/useAccountOperationsToolProps.ts) in
`@devtools/bindings`. The host supplies only what it alone can know — its accounts shaped as
`AccountRef`s, their names, and the display units.

It takes the **same** inputs as the balances tool. Only the datum being read differs, which is the
shape the slicing is supposed to produce.

## Import boundaries

This package may import **no** `@devtools/*` package; see
[the devtools import-boundary rule](../../.claude/skills/devtools-import-boundary/SKILL.md). App state
arrives as props built in `@devtools/bindings`, never through a new import here.
