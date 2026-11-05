# @features/flow-account-detail-hero

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Account Detail hero (balance, quick actions and empty state), shared by Ledger Wallet desktop and mobile and composed by
`@features/flow-account-detail`.

This package is currently a skeleton: it exposes a dual-platform public API (web via
[`src/index.ts`](src/index.ts), native via [`src/index.native.ts`](src/index.native.ts)) with no
exports yet. Add them under `src/` and export them through [`src/exports.ts`](src/exports.ts).

## Actions and tracking

`AccountHeroPort.onAction(id, location)` tells where the action was picked: `quick_action` (a hero
action or tile) or `more` (the "More" sheet, LWM). `onOpenMore` is called when the "More" tile is
pressed. The apps use both to track the quick actions (see the tracking section of
`@features/flow-account-detail`): the plan sends an event for the tile and nothing more for an action
picked inside the "More" sheet. `tag` (optional) is the ready-to-display address type shown above the
balance.

