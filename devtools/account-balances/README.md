# @devtools/account-balances

Lists the profile's accounts and reads each one's **balance** through
[`@features/platform-account-data`](../../features/platform/account-data/README.md) — the balance and
nothing else.

What it makes visible, which is the reason it exists:

- **which source answered** — `granular` (one coin-module `getBalance` call) or `full-sync` (a whole
  `AccountBridge.sync()`), so the selection stops being a thing you take on trust;
- **the token balances that came back in the same read**, since one `getBalance` returns every asset
  an address holds;
- **freshness** — how old the stored value is, which is also what decides whether a read happens at
  all.

`Read balance` forces a round-trip (`maxAge: 0`). `Read all` does not: it reproduces what a portfolio
mount does, so the reads it *skips* — the ones whose stored balance is still fresh — are the point.

## Props

Everything arrives as props (see [`src/types.ts`](./src/types.ts)), built by
[`useAccountBalancesToolProps`](../bindings/src/useAccountBalancesToolProps.ts) in
`@devtools/bindings`. The host supplies only what it alone can know — its accounts, shaped as
`AccountRef`s, with their display names.

## Import boundaries

This package may import **no** `@devtools/*` package. All other `@devtools/*` imports are forbidden;
see [the devtools import-boundary rule](../../.claude/skills/devtools-import-boundary/SKILL.md). App
state arrives as props built in `@devtools/bindings`, never through a new import here.
