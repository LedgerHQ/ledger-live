# @features/flow-stake-position

> [!CAUTION]
> **Status: UNSTABLE**. New package: the contract is still being built with its first live app, Earn.

Ledger Wallet's own view of one staking position: its details, then its full deactivation or withdraw-all, signed on the device. A Lumen `Dialog` on LWD, a `QueuedBottomSheet` on LWM. The Earn live app opens it through the Wallet API, and a wallet screen (the account page) opens it directly. First use: Solana.

## One source per figure

- Every figure the details show (status, total rewards, balance, initial deposit, validator name and logo) comes from the Earn backend, through `@domain/api-earn-positions`, read by the wallet address of the account. The caller passes the identity of the position only.
- "Current APY" is the APY of the validator the position is delegated to now, read on demand by the vote account of the current row. It never holds the details back: while it loads, fails, or names no validator, its row is hidden. The position APY of the backend is never shown.
- The chain (the account state the app maps into a `StakePositionSnapshot`) builds, gates and signs the exit, and decides the exit button. The confirmation names the figure of the same chain snapshot as the prepared transaction (`getExitAmount`). It can differ from the backend balance of the details: an undelegation signs only the stake account, and a withdrawal includes the rent reserve.
- A missing backend figure hides its row. Nothing falls back to the chain, the caller or another field: the initial deposit is never the balance minus the rewards.

## Wallet API contract

`handlers({ uiHooks })` returns the `custom.stake.position.open` handler to merge into a live app player's custom handlers. Its params are `{ accountId, positionId }`: the Wallet API account id and the position (a stake account address on Solana), each trimmed, from 1 to 128 characters. Unknown keys are dropped, so a caller still sending the former `rewards` or `validatorAddress` keeps working. Invalid params answer `INVALID_PARAMS`.

The host answers `StakePositionOpenResult`, `{ action, reason? }`:

- `deactivate` or `withdraw` once the transaction is broadcast, so the live app can refresh;
- `earnMore` before the host closes: for the Earn live app, Earn opens its own deposit flow;
- `null` when the user leaves, or when the flow fails or is abandoned;
- `{ action: null, reason: "unavailable" }` when the backend cannot provide the position for the Earn live app (a failed read, a timeout, a payload that breaks the contract, a provider failure with the row missing, no row, a closed row, two rows for one stake account, a status this version does not know). The host shows no error then: the request closes and Earn falls back to its own menu. `useStakePositionData` does it; `answerStakePositionUnavailable` does it for a reason the app finds itself. A wallet screen shows the error or not-found state instead.

A host error keeps its name in the answer: `StakePositionAccountNotFound`, `StakePositionUnsupported` or `StakePositionBusy`. A host that registers the handler passes the live app input `NATIVE_STAKE_POSITION_INPUT_KEY` set to `NATIVE_STAKE_POSITION_INPUT_VALUE`.

## Request store

`useStakePositionRequester(origin)` returns the function the ui hook calls once the app has resolved the account; unmounting the player dismisses its open request. `useStakePositionOpener(origin)` opens a position from a wallet screen: it waits for no answer, opens nothing while another position is being signed, and keeps its request when the screen unmounts. One request is shown at a time, and these functions move it:

| Call | `open` | `committed` (signed or handed off) | `settled` (answered, result shown) |
| --- | --- | --- | --- |
| a new request | answers `null`, replaced | refused with `StakePositionBusy` | replaced |
| `dismissStakePosition` | answers `null`, removed | ignored | removed |
| `commitStakePosition` | becomes `committed` | ignored | ignored |
| `reopenStakePosition` | ignored | becomes `open`, for a retry or a dismissal | ignored |
| `settleStakePosition` | answers the action, becomes `settled` | answers the action, becomes `settled` | ignored |
| `answerStakePositionUnavailable` | answers `null`, with `reason: "unavailable"` for origin `earn`, removed | ignored | ignored |
| `abandonStakePosition` | answers `null`, removed | answers `null`, removed | removed |

An id that is no longer the shown request is ignored, and a request answers once. `useShownStakePosition(origin?)` gives the request a surface renders and its phase, keeping the last one as `closed` while the surface animates out. `useIsStakePositionShown(origin?)` says whether a request is held. Both take every origin when it is omitted.

## Data

- `useStakePositionData({ request, isOpen, network, ownerAddress })` returns `loading`, `notFound`, `error` (with `retry`), `unavailable` (the Earn live app's request, closed as above) or `ready` with the backend `position`, its displayed `status`, the `validatorApy`, `isStale` and `isPolling`. It reads again positions older than 30 s on each open.
- After the user's own broadcast, call the function `useMarkStakePositionTransacted()` returns with `{ ownerAddress, positionId, action }`. It drops the cached positions of the address, and for 10 minutes every open of that position reads with `fresh` and polls every 3 s, for at most a minute per open, until the backend shows the transaction: a deactivating or deactivated row after a deactivation; no row, a closed row or an empty one after a withdrawal, never a row missing behind a provider failure. `markStakePositionTransacted` records the transaction alone.
- `toStakePositionDetailsProps(data, chainExit, format)` builds the details from a `ready` result, the chain exit `toChainExit(snapshot, isSyncing)` and the app's `StakePositionFormatter`. `getStakePositionValidatorName(position)` names the validator for the confirmation.

## What the package owns

- The rules: `getExitAction`, `getPositionNotice`, `getExitAmount`, `toChainExit`, `toDisplayedState`, `isStatusConsistent` and `isPositionDataStale`.
- The steps of a surface: `stakePositionStepReducer` and `useStakePositionSteps`.
- The universal views: `StakePositionSurface` (the title; for a confirmation or a result, a header with the close button alone; no back button; no way to close once signed), `StakePositionDetails`, `StakePositionConfirm`, `StakePositionResult` and `StakePositionUnavailable`. A result has no close button of its own: keep its surface dismissible, and reopen a failed signed request so that the header closes it.
- The `stakePosition.*` wording keys, which each consuming app adds to its English catalog. `stakePosition.details.initialDeposit` is web only.
- `useStakePositionTracking`: page and button events with `source` set to `earn` or `account`, and no address, amount or validator. The transaction is the host's to report, through its lifecycle seam.

## Defaults the product has not confirmed

Each one is a single line of `src/logic/productRules.ts`: the exit each chain state offers, the states that offer Earn more (active and activating), the statuses that show the APY row (all), whether the web details show the initial deposit (yes), the snapshot figure the confirmation names for each exit, what an unknown status reads as (not found), whether a stale backend snapshot shows the updating notice (yes), whether the exit waits while the backend has not shown the user's own transaction (yes), and which notice wins when several apply.

## What the apps own

Finding the account and the chain position, syncing it, mapping it into a snapshot and formatted amounts, building and signing the transaction, the device steps, registering the Earn service, the navigation of Earn more from a wallet screen, and the gate of the account page entry: the `earnNativeStakePosition` flag with `params?.accountPage === true` read strictly, since remote flag values are not parsed with its schema.
