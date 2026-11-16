# @features/flow-stake-position

> [!CAUTION]
> **Status: UNSTABLE**. New package: the contract is still being built with its first live app, Earn.

Ledger Wallet's own view of one staking position that a live app opens: the position's details, then its full deactivation or withdraw-all, signed on the device. A Lumen `Dialog` on LWD, a `QueuedBottomSheet` on LWM. The package knows no coin: each app maps its family's position into the package's types.

## Wallet API contract

`handlers({ uiHooks })` returns the `custom.stake.position.open` handler to merge into a live app player's custom handlers. Its params are `{ accountId, positionId, validatorAddress, rewards? }`: the Wallet API account id, the position (a stake account address on Solana), its validator, and the total rewards in the currency's smallest unit. The validator is empty when the position has none, such as an undelegated Solana stake account. The rewards are for display only and are dropped unless they are a whole number. Invalid params answer `INVALID_PARAMS`.

The host answers `{ action }`:

- `deactivate` or `withdraw` once the transaction is broadcast, so the live app can refresh;
- `earnMore` before the host opens its deposit flow;
- `null` when the user leaves, or when the flow fails or is abandoned;
- `{ action: null, reason }`, with `reason` set to `ambiguous` or `notFound`, when the host cannot act on the position. The live app then falls back to its own behaviour. `resolvePositionMatch` decides it: the live app may group several positions of one validator in one row. A position without a validator shares none, so it is never ambiguous: its id finds it, and only if the account holds it with no validator too.

A host error keeps its name in the answer: `StakePositionAccountNotFound`, `StakePositionUnsupported` or `StakePositionBusy`. A host that registers the handler passes the live app input `NATIVE_STAKE_POSITION_INPUT_KEY` set to `NATIVE_STAKE_POSITION_INPUT_VALUE`. `stakePrograms` cannot carry it: it only names each currency's deposit provider.

## Request store

`useStakePositionRequester(origin)` returns the function the ui hook calls once the app has resolved the account. Unmounting the player dismisses its open request. One request is shown at a time, and these functions move it:

| Call | `open` | `committed` (signed or handed off) | `settled` (answered, result shown) |
| --- | --- | --- | --- |
| a new request | answers `null`, replaced | refused with `StakePositionBusy` | replaced |
| `dismissStakePosition` | answers `null`, removed | ignored | removed |
| `commitStakePosition` | becomes `committed` | ignored | ignored |
| `reopenStakePosition` | ignored | becomes `open`, for a retry | ignored |
| `settleStakePosition` | answers the action, becomes `settled` | answers the action, becomes `settled` | ignored |
| `settleStakePositionUnavailable` | answers `null` and the reason, removed | ignored | ignored |
| `abandonStakePosition` | answers `null`, removed | answers `null`, removed | removed |

An id that is no longer the shown request is ignored, and a request answers once. `useShownStakePosition(origin)` gives the request a surface renders and its phase, keeping the last one as `closed` while the surface animates out. `useIsStakePositionShown(origin)` says whether a request is held, for an app that tracks its open dialogs.

## What the package owns

- The rules: `getExitAction`, `getPositionNotice`, `getDisplayedAmount`, `getExitAmount` and `isPositionDataStale` over a `StakePositionSnapshot`.
- The steps of a surface: `stakePositionStepReducer` and `useStakePositionSteps`.
- The universal views: `StakePositionSurface` (title, back, close, and no way to close once signed), `StakePositionDetails`, `StakePositionConfirm` and `StakePositionUnavailable`. Each view renders its body and its actions inside the surface.
- The `stakePosition.*` wording keys, which each consuming app adds to its English catalog.
- `useStakePositionTracking`: page and button events, with no address, amount or validator. The transaction is the host's to report: its lifecycle seam sends `tx_intent` and `tx_terminal`, plus one Segment completion event.

## What the apps own

Finding the account and the position, syncing it, mapping it into a snapshot and formatted amounts, building and signing the transaction, and the screens around it: the device steps, the result and the deposit flow.
