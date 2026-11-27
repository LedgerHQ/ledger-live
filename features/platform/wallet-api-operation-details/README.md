# @features/platform-wallet-api-operation-details

> [!CAUTION]
> **Status: UNSTABLE**. New package; the `custom.openOperationDetails` contract may still change.

Wallet API custom handler (`custom.openOperationDetails`) that lets a live app open Ledger Wallet's native details of one of the user's operations, for example right after a deposit it broadcast.

## How it works

The live app calls `custom.openOperationDetails` with `{ accountId, transactionHash }`, where `accountId` is the Wallet API id of the account. Invalid params reject with `INVALID_PARAMS` and open nothing.

`handlers({ uiHooks })` returns the handler to merge into a live app player's custom handlers. Each app implements `OperationDetailsUiHooks`:

- `operationDetails.open({ walletAccountId, transactionHash })` finds the account and its confirmed or pending operation with the hash, then opens its details: the drawer on desktop, the screen on mobile. It throws `OperationDetailsAccountNotFound` or `OperationDetailsOperationNotFound` when there is none, and the live app gets the error with its name.

The account lookup stays in the apps: it reads the legacy accounts, which a layer package can't depend on.
