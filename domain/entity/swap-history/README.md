# @domain/entity-swap-history

> [!CAUTION]
> **Status: UNSTABLE** — PoC, API still being designed. Read-only for now: the legacy accounts remain the source of truth.

The swaps the app made, keyed by `AccountUUID`.

## Scope

Swap history is app-owned data, not an account data kind: no source can rebuild it. The app writes an entry once a swap is broadcast, and the swap backend only refreshes the status of swaps the app already knows. So it has no `AccountDataRegistry` line and no reader, just a slice.

## Model

`SwapHistoryState` is a `partialRecord(AccountUUID, SwapHistoryEntry[])`. An entry (`schema.ts`):

- `swapId`, `provider`, `status`: the provider's swap and its status.
- `accountUUID`, `assetId`: the account and asset the swap is recorded on, the one holding `operationId`. It is the sender, except when the sender has no operation to anchor it (perps withdraw): then `fromAccountUUID` / `fromAssetId` name the sender.
- `toAccountUUID`, `toAssetId`: the receiving account and asset; `toAccountUUID` is absent when the accounts list does not hold it.
- `operationId`: absent until known.
- `fromAmount`, `feesAmount`, `payoutFeesAmount`: integer strings in the asset's smallest unit. `toAmount` (amount × rate) is a non-negative decimal string in the receiving asset's smallest unit, kept unrounded. `finalAmount` is a decimal in the receiving asset's main unit, as centralized providers report it.
- `createdAt`: ms, when no operation dates the swap yet.

Slice `swapHistory`: `swapHistorySynced` replaces the whole state; selectors `selectAccountSwapHistory`, `selectSwapHistoryEntries`, `selectSwapHistoryEntry`. Mocks: `./schema.mock`, `./slice.mock`.

## Legacy mirror (`src/legacy/`)

Today the history lives in the legacy `Account.swapHistory` and `TokenAccount.swapHistory`, persisted with the accounts. `connectSwapHistoryStore(store, { selectLegacyAccounts, toAccountUUID, selectAccountIndex, onError })` mirrors it into the slice whenever a history or the account index changes:

- A token account's swaps go to its parent's `AccountUUID`, with the token as `assetId`.
- `toAccountUUID` maps a top-level legacy id to the `AccountUUID` the `accounts` slice lists; a swap recorded on an account it does not list is left out. No legacy id reaches the slice.
- A swap the schema rejects is left out and reported once to `onError`.

```ts
connectSwapHistoryStore(store, {
  selectLegacyAccounts: accountsSelector,
  toAccountUUID: (state, legacyId) => selectAccountUUIDByLegacyId(state, legacyId),
  selectAccountIndex: state => state.accountEntries,
});
```

## Next steps

- Move the writes here: adding a swap after broadcast (`addToSwapHistory`, `saveSwapToHistory`), and the status refresh (`updateAccountSwapStatus`, `/swap/status` polling) as reducers of this slice.
- Persist the slice in each app, and migrate once at startup: read every legacy `swapHistory` into the slice, then stop writing it on the account.
- Drop the mirror and `swapHistory` from the legacy `Account` once nothing reads it.
- Join entries with the `operations` entity instead of the legacy accounts' operations in the history screens.
