# @features/flow-account-detail-delegations

> **Status: UNSTABLE**: API still being designed for the Account Detail page.

The delegation section of the Account Detail page, shared by every family that stakes or delegates.
Built on Lumen: a table on LWD, a list with a details bottom sheet on LWM.

## What it owns

- `AccountDelegations`: one universal component with one props contract
  (`AccountDelegations.types.ts`). It has no coin knowledge: validator rows with a status, cells and
  actions (an action with a `disabledReason` is disabled and says why), header actions, an empty
  state, a footer and a loading state.
- Discreet mode: a cell flagged `sensitive` is masked when `discreet` is on.
- LWD: whole row clickable (opens the validator), gear menu for the row actions, data columns
  aligned to the end.
- LWM: tapping a row opens a sheet with its details, its actions as buttons and, with
  `openValidatorLabel`, a link to the validator.

## What the apps own

Mapping the account of a family into the props (labels, amounts, actions) and handling the intents
(opening a modal or a flow, a link). A family fills the `AccountDetailDelegations` slot of the
family contract; the new Account Detail page renders it last in the custom place, and a family
without it keeps its legacy `AccountBodyHeader`.

## Platform-only props

Three labels are read on web only (`validatorColumnLabel`, `statusColumnLabel`, `rowActionsLabel`)
and one on native only (`openValidatorLabel`); each is optional and tagged `@platform` in the
contract, as the [universal components ADR](../../../docs/adr/universal-components.md) asks.
