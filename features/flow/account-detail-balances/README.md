# @features/flow-account-detail-balances

> **Status: UNSTABLE**: API still being designed for the Account Detail page.

The balance breakdown of the Account Detail page: one Lumen card per figure (available balance,
delegated, frozen, withdrawable...) with an explanation of what it is. Built to be shared by every
family whose balance footer is a list of labelled amounts.

## What it owns

- `AccountBalances`: one universal component with one props contract (`AccountBalances.types.ts`).
  An item has an `id`, a `label`, a ready-to-display `value` and an optional `description`.
- LWD: a wrapping row of info cards, like the PnL cards; the description is a tooltip.
- LWM: cards two per row; a card with a description opens an info sheet.
- Discreet mode: every value is masked unless the item sets `sensitive: false` (a figure that is not
  an amount, like bandwidth).

## What the apps own

Turning the account of a family into items (labels, formatted amounts, descriptions). A family fills
the `AccountDetailBalances` slot of the family contract; the new Account Detail page renders it in
place of the legacy `AccountBalanceSummaryFooter`, and a family without it keeps the legacy footer.
